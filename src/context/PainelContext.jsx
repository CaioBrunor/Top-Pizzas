import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../lib/api";
import { moeda, primeiroNome } from "../lib/format";
import { ler, gravar } from "../lib/persistencia";
import { socket } from "../lib/tempoReal";
import { useLoja } from "./LojaContext";

const PainelContext = createContext(null);

const VAZIO = { pedidos: [], contas: [], entregadores: [] };

const inserirOuTrocar = (lista, item) =>
  lista.some((i) => i.id === item.id)
    ? lista.map((i) => (i.id === item.id ? item : i))
    : [item, ...lista];

// Dados que só o painel enxerga: todos os pedidos, as contas dos clientes e
// os entregadores. Fica dentro do AdminLayout, então só carrega com o admin
// logado.
export function PainelProvider({ children }) {
  const { recarregarCatalogo } = useLoja();

  // A última cópia fica no localStorage para o painel abrir na hora e
  // continuar legível sem internet.
  const [dados, setDados] = useState(() => {
    const salvo = ler("painel", null);
    return Array.isArray(salvo?.pedidos) && Array.isArray(salvo?.contas)
      ? { ...VAZIO, ...salvo }
      : VAZIO;
  });
  // Onde cada entregador está agora. Muda a cada poucos segundos e não vale
  // nada depois, então fica fora da cópia guardada.
  const [posicoes, setPosicoes] = useState({});
  const [sincronizado, setSincronizado] = useState(false);
  const [falha, setFalha] = useState(null);
  const [novos, setNovos] = useState([]);
  const [aviso, setAviso] = useState(null);

  useEffect(() => gravar("painel", dados), [dados]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 7000);
    return () => clearTimeout(t);
  }, [aviso]);

  const sincronizar = useCallback(async () => {
    try {
      const [{ pedidos }, { clientes }, { entregadores }] = await Promise.all([
        api("/pedidos", { escopo: "admin" }),
        api("/clientes", { escopo: "admin" }),
        api("/entregadores", { escopo: "admin" }),
      ]);
      setDados({
        pedidos,
        contas: clientes,
        entregadores: entregadores.map(({ posicao, ...conta }) => conta),
      });
      setPosicoes(
        Object.fromEntries(entregadores.map((e) => [e.id, e.posicao])),
      );
      setSincronizado(true);
      setFalha(null);
    } catch (erro) {
      setFalha(erro.message);
    }
  }, []);

  useEffect(() => {
    const aoCriar = (pedido) => {
      setDados((d) => ({ ...d, pedidos: inserirOuTrocar(d.pedidos, pedido) }));
      setNovos((ids) => [...ids, pedido.id]);
      setAviso({
        texto: `Novo pedido ${pedido.id}: ${primeiroNome(pedido.cliente.nome)}, ${moeda(pedido.total)}`,
        para: "/admin/pedidos",
      });
    };
    const aoAtualizar = (pedido) => {
      setDados((d) => ({ ...d, pedidos: inserirOuTrocar(d.pedidos, pedido) }));
      setNovos((ids) => ids.filter((id) => id !== pedido.id));
    };
    const aoSalvarCliente = (conta) =>
      setDados((d) => ({ ...d, contas: inserirOuTrocar(d.contas, conta) }));
    const aoSalvarEntregador = ({ posicao, ...conta }) =>
      setDados((d) => ({
        ...d,
        entregadores: inserirOuTrocar(d.entregadores, conta),
      }));
    const aoRemoverEntregador = ({ id }) =>
      setDados((d) => ({
        ...d,
        entregadores: d.entregadores.filter((e) => e.id !== id),
      }));
    const aoMover = ({ entregadorId, posicao }) =>
      setPosicoes((p) => ({ ...p, [entregadorId]: posicao }));

    // Busca tudo ao abrir, sempre que o tempo real (re)conecta e quando a
    // internet volta: assim nada que aconteceu durante uma queda se perde.
    sincronizar();
    socket.on("connect", sincronizar);
    socket.on("dados:restaurados", sincronizar);
    socket.on("pedido:criado", aoCriar);
    socket.on("pedido:atualizado", aoAtualizar);
    socket.on("cliente:salvo", aoSalvarCliente);
    socket.on("entregador:salvo", aoSalvarEntregador);
    socket.on("entregador:removido", aoRemoverEntregador);
    socket.on("entregador:posicao", aoMover);
    window.addEventListener("online", sincronizar);
    return () => {
      socket.off("connect", sincronizar);
      socket.off("dados:restaurados", sincronizar);
      socket.off("pedido:criado", aoCriar);
      socket.off("pedido:atualizado", aoAtualizar);
      socket.off("cliente:salvo", aoSalvarCliente);
      socket.off("entregador:salvo", aoSalvarEntregador);
      socket.off("entregador:removido", aoRemoverEntregador);
      socket.off("entregador:posicao", aoMover);
      window.removeEventListener("online", sincronizar);
    };
  }, [sincronizar]);

  // Ações que não têm um formulário para mostrar o erro avisam por aqui.
  const tentar = useCallback(async (acao) => {
    try {
      await acao();
      return true;
    } catch (erro) {
      setAviso({ texto: erro.message, erro: true });
      return false;
    }
  }, []);

  const marcarVisto = useCallback(
    (id) => setNovos((ids) => ids.filter((i) => i !== id)),
    [],
  );

  // `entregadorId` só é usado quando o pedido sai para entrega.
  const atualizarStatus = useCallback(
    async (id, status, entregadorId) => {
      marcarVisto(id);
      const deuCerto = await tentar(async () => {
        const { pedido } = await api(`/pedidos/${encodeURIComponent(id)}/status`, {
          metodo: "PATCH",
          corpo: { status, entregadorId },
          escopo: "admin",
        });
        setDados((d) => ({ ...d, pedidos: inserirOuTrocar(d.pedidos, pedido) }));
      });
      // Recusado: outra pessoa pode ter mexido no pedido antes. Atualiza a tela.
      if (!deuCerto) sincronizar();
    },
    [marcarVisto, tentar, sincronizar],
  );

  const trocarEntregador = useCallback(
    (pedidoId, entregadorId) =>
      tentar(async () => {
        const { pedido } = await api(
          `/pedidos/${encodeURIComponent(pedidoId)}/entregador`,
          { metodo: "PUT", corpo: { entregadorId }, escopo: "admin" },
        );
        setDados((d) => ({ ...d, pedidos: inserirOuTrocar(d.pedidos, pedido) }));
      }),
    [tentar],
  );

  const guardarEntregador = useCallback(({ posicao, ...conta }) => {
    setDados((d) => ({
      ...d,
      entregadores: inserirOuTrocar(d.entregadores, conta),
    }));
  }, []);

  // Lança o erro para o formulário mostrar os campos recusados pelo servidor.
  const salvarEntregador = useCallback(
    async ({ id, ...corpo }) => {
      const { entregador } = id
        ? await api(`/entregadores/${encodeURIComponent(id)}`, {
            metodo: "PUT",
            corpo,
            escopo: "admin",
          })
        : await api("/entregadores", { metodo: "POST", corpo, escopo: "admin" });
      guardarEntregador(entregador);
    },
    [guardarEntregador],
  );

  const definirEntregadorAtivo = useCallback(
    (id, ativo) =>
      tentar(async () => {
        const { entregador } = await api(
          `/entregadores/${encodeURIComponent(id)}/ativo`,
          { metodo: "PATCH", corpo: { ativo }, escopo: "admin" },
        );
        guardarEntregador(entregador);
      }),
    [tentar, guardarEntregador],
  );

  const removerEntregador = useCallback(
    (id) =>
      tentar(async () => {
        await api(`/entregadores/${encodeURIComponent(id)}`, {
          metodo: "DELETE",
          escopo: "admin",
        });
        setDados((d) => ({
          ...d,
          entregadores: d.entregadores.filter((e) => e.id !== id),
        }));
      }),
    [tentar],
  );

  // Lança o erro para o formulário mostrar os campos recusados pelo servidor.
  const salvarProduto = useCallback(
    async ({ id, ...produto }) => {
      if (id) {
        await api(`/produtos/${encodeURIComponent(id)}`, {
          metodo: "PUT",
          corpo: produto,
          escopo: "admin",
        });
      } else {
        await api("/produtos", { metodo: "POST", corpo: produto, escopo: "admin" });
      }
      await recarregarCatalogo();
    },
    [recarregarCatalogo],
  );

  const definirDisponibilidade = useCallback(
    (id, disponivel) =>
      tentar(async () => {
        await api(`/produtos/${encodeURIComponent(id)}/disponibilidade`, {
          metodo: "PATCH",
          corpo: { disponivel },
          escopo: "admin",
        });
        await recarregarCatalogo();
      }),
    [tentar, recarregarCatalogo],
  );

  const removerProduto = useCallback(
    (id) =>
      tentar(async () => {
        await api(`/produtos/${encodeURIComponent(id)}`, {
          metodo: "DELETE",
          escopo: "admin",
        });
        await recarregarCatalogo();
      }),
    [tentar, recarregarCatalogo],
  );

  const restaurarDados = useCallback(
    () =>
      tentar(async () => {
        await api("/admin/restaurar", { metodo: "POST", escopo: "admin" });
        setNovos([]);
        await Promise.all([sincronizar(), recarregarCatalogo()]);
      }),
    [tentar, sincronizar, recarregarCatalogo],
  );

  // Cada conta com o resumo dos próprios pedidos, recalculado a cada pedido
  // que chega.
  const clientes = useMemo(() => {
    const porId = new Map(
      dados.contas.map((conta) => [
        conta.id,
        {
          ...conta,
          bairro: conta.endereco?.bairro ?? "",
          pedidos: 0,
          gastoTotal: 0,
          ultimoPedido: null,
        },
      ]),
    );

    dados.pedidos.forEach((pedido) => {
      const cliente = porId.get(pedido.clienteId);
      if (!cliente) return;
      if (!cliente.ultimoPedido || pedido.criadoEm > cliente.ultimoPedido) {
        cliente.ultimoPedido = pedido.criadoEm;
      }
      if (pedido.status === "cancelado") return;
      cliente.pedidos += 1;
      cliente.gastoTotal += pedido.total;
    });

    return [...porId.values()].sort(
      (a, b) =>
        b.gastoTotal - a.gastoTotal || b.criadoEm.localeCompare(a.criadoEm),
    );
  }, [dados]);

  // Cada entregador com o que está levando agora, quantas entregas já fez e
  // onde está.
  const entregadores = useMemo(
    () =>
      dados.entregadores
        .map((conta) => {
          const dele = dados.pedidos.filter((p) => p.entregador?.id === conta.id);
          return {
            ...conta,
            naRua: dele.filter((p) => p.status === "entrega"),
            entregasFeitas: dele.filter((p) => p.status === "entregue").length,
            posicao: posicoes[conta.id] ?? null,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [dados, posicoes],
  );

  const dispensarAviso = useCallback(() => setAviso(null), []);

  const valor = useMemo(
    () => ({
      pedidos: dados.pedidos,
      clientes,
      entregadores,
      carregando: !sincronizado && !falha && dados.pedidos.length === 0,
      falha,
      novos,
      marcarVisto,
      aviso,
      dispensarAviso,
      atualizarStatus,
      trocarEntregador,
      salvarEntregador,
      definirEntregadorAtivo,
      removerEntregador,
      salvarProduto,
      definirDisponibilidade,
      removerProduto,
      restaurarDados,
    }),
    [
      dados,
      clientes,
      entregadores,
      sincronizado,
      falha,
      novos,
      marcarVisto,
      aviso,
      dispensarAviso,
      atualizarStatus,
      trocarEntregador,
      salvarEntregador,
      definirEntregadorAtivo,
      removerEntregador,
      salvarProduto,
      definirDisponibilidade,
      removerProduto,
      restaurarDados,
    ],
  );

  return (
    <PainelContext.Provider value={valor}>{children}</PainelContext.Provider>
  );
}

export function usePainel() {
  const ctx = useContext(PainelContext);
  if (!ctx) throw new Error("usePainel precisa estar dentro de PainelProvider");
  return ctx;
}
