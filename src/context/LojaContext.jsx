import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PRODUTOS, VERSAO_CATALOGO } from "../data/catalogo";
import { api } from "../lib/api";
import { etapaDoPedido } from "../lib/format";
import { ler, gravar } from "../lib/persistencia";
import { lerSessao } from "../lib/sessao";
import { socket } from "../lib/tempoReal";
import { useAuth } from "./AuthContext";

const LojaContext = createContext(null);

const SEM_PEDIDOS = [];

const inserirOuTrocar = (lista, pedido) =>
  lista.some((p) => p.id === pedido.id)
    ? lista.map((p) => (p.id === pedido.id ? pedido : p))
    : [pedido, ...lista];

export function LojaProvider({ children }) {
  const { cliente, atualizarCliente } = useAuth();
  const clienteId = cliente?.id ?? null;

  // Enquanto o servidor não responde (ou sem internet), a tela mostra a
  // última cópia do cardápio guardada no navegador.
  const [produtos, setProdutos] = useState(() => {
    const salvo = ler("produtos", null);
    return salvo?.versao === VERSAO_CATALOGO && Array.isArray(salvo.lista)
      ? salvo.lista
      : PRODUTOS;
  });
  const [catalogoSincronizado, setCatalogoSincronizado] = useState(false);

  // Guardado junto com o dono para a lista de uma conta nunca aparecer em
  // outra que entre no mesmo navegador.
  const [guardados, setGuardados] = useState(() => {
    const salvo = ler("meusPedidos", null);
    return Array.isArray(salvo?.lista) ? salvo : null;
  });
  const meusPedidos =
    clienteId && guardados?.clienteId === clienteId
      ? guardados.lista
      : SEM_PEDIDOS;

  const [notificacao, setNotificacao] = useState(null);

  useEffect(
    () => gravar("produtos", { versao: VERSAO_CATALOGO, lista: produtos }),
    [produtos],
  );
  useEffect(() => {
    if (guardados) gravar("meusPedidos", guardados);
  }, [guardados]);

  useEffect(() => {
    if (!notificacao) return undefined;
    const t = setTimeout(() => setNotificacao(null), 7000);
    return () => clearTimeout(t);
  }, [notificacao]);

  const recarregarCatalogo = useCallback(async () => {
    try {
      const { produtos: lista } = await api("/produtos");
      setProdutos(lista);
      setCatalogoSincronizado(true);
    } catch {
      // Sem conexão: continua valendo a cópia guardada.
    }
  }, []);

  const guardarPedido = useCallback((pedido) => {
    setGuardados((atual) => ({
      clienteId: pedido.clienteId,
      lista: inserirOuTrocar(
        atual?.clienteId === pedido.clienteId ? atual.lista : [],
        pedido,
      ),
    }));
  }, []);

  const recarregarMeusPedidos = useCallback(async () => {
    const dono = lerSessao("cliente")?.usuario.id;
    if (!dono) return;
    try {
      const { pedidos } = await api("/pedidos/meus", { escopo: "cliente" });
      // A conta pode ter mudado enquanto a resposta vinha.
      if (lerSessao("cliente")?.usuario.id === dono) {
        setGuardados({ clienteId: dono, lista: pedidos });
      }
    } catch {
      // Sem conexão: continua valendo a cópia guardada.
    }
  }, []);

  // Cardápio: busca ao abrir, sempre que o tempo real (re)conecta e quando a
  // internet volta. Entre uma busca e outra, o servidor avisa cada mudança.
  useEffect(() => {
    const aoSalvar = (produto) =>
      setProdutos((atual) =>
        atual.some((p) => p.id === produto.id)
          ? atual.map((p) => (p.id === produto.id ? produto : p))
          : [produto, ...atual],
      );
    const aoRemover = ({ id }) =>
      setProdutos((atual) => atual.filter((p) => p.id !== id));

    recarregarCatalogo();
    socket.on("connect", recarregarCatalogo);
    socket.on("dados:restaurados", recarregarCatalogo);
    socket.on("produto:salvo", aoSalvar);
    socket.on("produto:removido", aoRemover);
    window.addEventListener("online", recarregarCatalogo);
    return () => {
      socket.off("connect", recarregarCatalogo);
      socket.off("dados:restaurados", recarregarCatalogo);
      socket.off("produto:salvo", aoSalvar);
      socket.off("produto:removido", aoRemover);
      window.removeEventListener("online", recarregarCatalogo);
    };
  }, [recarregarCatalogo]);

  // Pedidos do cliente que está com a conta aberta.
  useEffect(() => {
    if (!clienteId) return undefined;

    // Os eventos "meu-pedido" trazem a visão do cliente (com o código de
    // entrega). São separados dos eventos do painel, que podem chegar pela
    // mesma conexão quando o admin está logado neste navegador.
    const aoCriar = (pedido) => {
      if (pedido.clienteId === clienteId) guardarPedido(pedido);
    };
    const aoAtualizar = (pedido) => {
      if (pedido.clienteId !== clienteId) return;
      guardarPedido(pedido);
      const etapa = etapaDoPedido(pedido).nome.toLowerCase();
      setNotificacao({
        pedidoId: pedido.id,
        texto:
          pedido.status === "entrega" && pedido.entregador
            ? `Pedido ${pedido.id} ${etapa} com ${pedido.entregador.nome}`
            : `Pedido ${pedido.id}: ${etapa}`,
      });
    };
    // O entregador se moveu: atualiza só o rastreio do pedido que ele leva.
    const aoMover = ({ pedidoId, posicao }) =>
      setGuardados((atual) =>
        atual?.clienteId === clienteId
          ? {
              ...atual,
              lista: atual.lista.map((p) =>
                p.id === pedidoId ? { ...p, rastreio: posicao } : p,
              ),
            }
          : atual,
      );

    recarregarMeusPedidos();
    socket.on("connect", recarregarMeusPedidos);
    socket.on("dados:restaurados", recarregarMeusPedidos);
    socket.on("meu-pedido:criado", aoCriar);
    socket.on("meu-pedido:atualizado", aoAtualizar);
    socket.on("meu-pedido:posicao", aoMover);
    window.addEventListener("online", recarregarMeusPedidos);
    return () => {
      socket.off("connect", recarregarMeusPedidos);
      socket.off("dados:restaurados", recarregarMeusPedidos);
      socket.off("meu-pedido:criado", aoCriar);
      socket.off("meu-pedido:atualizado", aoAtualizar);
      socket.off("meu-pedido:posicao", aoMover);
      window.removeEventListener("online", recarregarMeusPedidos);
    };
  }, [clienteId, guardarPedido, recarregarMeusPedidos]);

  const criarPedido = useCallback(
    async (dados) => {
      const { pedido, usuario } = await api("/pedidos", {
        metodo: "POST",
        corpo: dados,
        escopo: "cliente",
      });
      guardarPedido(pedido);
      // O servidor devolve a conta com o telefone e o endereço deste pedido.
      atualizarCliente(usuario);
      return pedido;
    },
    [guardarPedido, atualizarCliente],
  );

  const buscarPedido = useCallback(
    async (id) => {
      const { pedido } = await api(`/pedidos/${encodeURIComponent(id)}`, {
        escopo: "cliente",
      });
      guardarPedido(pedido);
      return pedido;
    },
    [guardarPedido],
  );

  const dispensarNotificacao = useCallback(() => setNotificacao(null), []);

  const valor = useMemo(
    () => ({
      produtos,
      catalogoSincronizado,
      recarregarCatalogo,
      meusPedidos,
      criarPedido,
      buscarPedido,
      notificacao,
      dispensarNotificacao,
    }),
    [
      produtos,
      catalogoSincronizado,
      recarregarCatalogo,
      meusPedidos,
      criarPedido,
      buscarPedido,
      notificacao,
      dispensarNotificacao,
    ],
  );

  return <LojaContext.Provider value={valor}>{children}</LojaContext.Provider>;
}

export function useLoja() {
  const ctx = useContext(LojaContext);
  if (!ctx) throw new Error("useLoja precisa estar dentro de LojaProvider");
  return ctx;
}
