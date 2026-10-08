import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { distanciaEmMetros } from "../../shared/geo.js";
import { api } from "../lib/api";
import { ler, gravar } from "../lib/persistencia";
import { socket } from "../lib/tempoReal";
import { useAuth } from "./AuthContext";

const EntregadorContext = createContext(null);

const VAZIO = { entregas: [], concluidas: [] };

// A posição vai para o servidor quando o entregador andou este tanto ou
// quando passou este tempo. Parado, ele ainda manda um sinal de tempos em
// tempos, para o cliente saber que a posição continua valendo.
const DISTANCIA_MINIMA = 25;
const ESPERA_MINIMA = 8_000;
const SINAL_PARADO = 30_000;

const enviar = (posicao) =>
  api("/entregas/posicao", {
    metodo: "POST",
    corpo: posicao,
    escopo: "entregador",
  }).catch(() => {});

/**
 * Acompanha o GPS do aparelho enquanto `ligada` for verdadeiro.
 * Estados: "desligada", "buscando", "ativa", "negada", "indisponivel", "erro".
 */
function useLocalizacao(ligada) {
  const [estado, setEstado] = useState("desligada");

  useEffect(() => {
    if (!ligada) {
      setEstado("desligada");
      return undefined;
    }
    if (!("geolocation" in navigator)) {
      setEstado("indisponivel");
      return undefined;
    }

    let ultima = null;
    let enviadaEm = 0;
    setEstado("buscando");

    const observador = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setEstado("ativa");
        const atual = {
          lat: coords.latitude,
          lng: coords.longitude,
          precisao: Math.round(coords.accuracy),
        };
        const andou = !ultima || distanciaEmMetros(ultima, atual) >= DISTANCIA_MINIMA;
        const esperou = Date.now() - enviadaEm >= ESPERA_MINIMA;
        if (ultima && (!andou || !esperou)) return;

        ultima = atual;
        enviadaEm = Date.now();
        enviar(atual);
      },
      (erro) => setEstado(erro.code === erro.PERMISSION_DENIED ? "negada" : "erro"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 },
    );

    const sinal = setInterval(() => {
      if (ultima && Date.now() - enviadaEm >= SINAL_PARADO) {
        enviadaEm = Date.now();
        enviar(ultima);
      }
    }, 5_000);

    // Com a tela apagada o navegador para de informar a posição, então o app
    // pede para ela ficar acesa durante a entrega (quando o aparelho permite).
    let trava = null;
    const manterTela = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        ?.request("screen")
        .then((t) => {
          trava = t;
        })
        .catch(() => {});
    };
    manterTela();
    document.addEventListener("visibilitychange", manterTela);

    return () => {
      navigator.geolocation.clearWatch(observador);
      clearInterval(sinal);
      document.removeEventListener("visibilitychange", manterTela);
      trava?.release().catch(() => {});
    };
  }, [ligada]);

  return estado;
}

export function EntregadorProvider({ children }) {
  const { entregador } = useAuth();

  const [dados, setDados] = useState(() => {
    const salvo = ler("minhasEntregas", null);
    return salvo?.entregadorId === entregador.id && Array.isArray(salvo.entregas)
      ? salvo
      : VAZIO;
  });
  const [falha, setFalha] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [compartilhar, setCompartilhar] = useState(true);
  const confirmandoRef = useRef(null);
  // Para os avisos do tempo real saberem o que já está na tela.
  const entregasRef = useRef(dados.entregas);
  entregasRef.current = dados.entregas;

  useEffect(
    () => gravar("minhasEntregas", { ...dados, entregadorId: entregador.id }),
    [dados, entregador.id],
  );

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  const sincronizar = useCallback(async () => {
    try {
      const { entregas, concluidas } = await api("/entregas", {
        escopo: "entregador",
      });
      setDados({ entregas, concluidas });
      setFalha(null);
    } catch (erro) {
      setFalha(erro.message);
    }
  }, []);

  useEffect(() => {
    const aoReceber = (entrega) => {
      const nova = !entregasRef.current.some((e) => e.id === entrega.id);
      setDados((d) => ({
        ...d,
        entregas: d.entregas.some((e) => e.id === entrega.id)
          ? d.entregas.map((e) => (e.id === entrega.id ? entrega : e))
          : [...d.entregas, entrega],
      }));
      if (nova) {
        setAviso(`Nova entrega: ${entrega.id}, ${entrega.entrega.bairro}`);
      }
    };

    const aoEncerrar = ({ id, status }) => {
      if (confirmandoRef.current !== id) {
        const motivos = {
          cancelado: "foi cancelada pela loja",
          transferida: "passou para outro entregador",
          entregue: "foi fechada pela loja",
        };
        setAviso(`A entrega ${id} ${motivos[status] ?? "saiu da sua lista"}`);
      }
      sincronizar();
    };

    sincronizar();
    socket.on("connect", sincronizar);
    socket.on("dados:restaurados", sincronizar);
    socket.on("entrega:salva", aoReceber);
    socket.on("entrega:encerrada", aoEncerrar);
    window.addEventListener("online", sincronizar);
    return () => {
      socket.off("connect", sincronizar);
      socket.off("dados:restaurados", sincronizar);
      socket.off("entrega:salva", aoReceber);
      socket.off("entrega:encerrada", aoEncerrar);
      window.removeEventListener("online", sincronizar);
    };
  }, [sincronizar]);

  const confirmar = useCallback(async (id, codigo) => {
    confirmandoRef.current = id;
    try {
      const { concluida } = await api(
        `/entregas/${encodeURIComponent(id)}/confirmar`,
        { metodo: "POST", corpo: { codigo }, escopo: "entregador" },
      );
      setDados((d) => ({
        entregas: d.entregas.filter((e) => e.id !== id),
        concluidas: [concluida, ...d.concluidas.filter((c) => c.id !== id)],
      }));
      setAviso(`Entrega ${id} confirmada`);
    } finally {
      // O aviso do servidor para esta entrega chega logo depois da resposta.
      setTimeout(() => {
        if (confirmandoRef.current === id) confirmandoRef.current = null;
      }, 3000);
    }
  }, []);

  const temEntrega = dados.entregas.length > 0;
  const localizacao = useLocalizacao(temEntrega && compartilhar);

  const dispensarAviso = useCallback(() => setAviso(null), []);

  const valor = useMemo(
    () => ({
      entregas: dados.entregas,
      concluidas: dados.concluidas,
      falha,
      aviso,
      dispensarAviso,
      confirmar,
      localizacao,
      compartilhar,
      setCompartilhar,
    }),
    [dados, falha, aviso, dispensarAviso, confirmar, localizacao, compartilhar],
  );

  return (
    <EntregadorContext.Provider value={valor}>
      {children}
    </EntregadorContext.Provider>
  );
}

export function useEntregas() {
  const ctx = useContext(EntregadorContext);
  if (!ctx) {
    throw new Error("useEntregas precisa estar dentro de EntregadorProvider");
  }
  return ctx;
}
