import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PRODUTOS, VERSAO_CATALOGO } from "../data/catalogo";
import { gerarPedidosIniciais } from "../data/seed";
import { gerarCodigoPedido } from "../lib/format";
import { ler, gravar } from "../lib/persistencia";

const LojaContext = createContext(null);

export function LojaProvider({ children }) {
  const [produtos, setProdutos] = useState(() => {
    const salvo = ler("produtos", null);
    return salvo?.versao === VERSAO_CATALOGO ? salvo.lista : PRODUTOS;
  });

  const [pedidos, setPedidos] = useState(() => {
    const salvo = ler("pedidos", null);
    return salvo?.versao === VERSAO_CATALOGO
      ? salvo.lista
      : gerarPedidosIniciais();
  });

  useEffect(
    () => gravar("produtos", { versao: VERSAO_CATALOGO, lista: produtos }),
    [produtos],
  );
  useEffect(
    () => gravar("pedidos", { versao: VERSAO_CATALOGO, lista: pedidos }),
    [pedidos],
  );

  const criarPedido = useCallback((dados) => {
    const pedido = {
      ...dados,
      id: gerarCodigoPedido(),
      criadoEm: new Date().toISOString(),
      status: "recebido",
      origem: "site",
    };
    setPedidos((atual) => [pedido, ...atual]);
    return pedido;
  }, []);

  const atualizarStatus = useCallback((id, status) => {
    setPedidos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  }, []);

  const salvarProduto = useCallback((produto) => {
    setProdutos((atual) => {
      const existe = atual.some((p) => p.id === produto.id);
      return existe
        ? atual.map((p) => (p.id === produto.id ? produto : p))
        : [produto, ...atual];
    });
  }, []);

  const alternarDisponibilidade = useCallback((id) => {
    setProdutos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, disponivel: !p.disponivel } : p)),
    );
  }, []);

  const removerProduto = useCallback((id) => {
    setProdutos((atual) => atual.filter((p) => p.id !== id));
  }, []);

  const restaurarDados = useCallback(() => {
    setProdutos(PRODUTOS);
    setPedidos(gerarPedidosIniciais());
  }, []);

  const clientes = useMemo(() => {
    const mapa = new Map();
    pedidos.forEach((pedido) => {
      const chave = pedido.cliente.telefone;
      const atual = mapa.get(chave);
      if (atual) {
        atual.pedidos += 1;
        atual.gastoTotal += pedido.total;
        if (new Date(pedido.criadoEm) > new Date(atual.ultimoPedido)) {
          atual.ultimoPedido = pedido.criadoEm;
          atual.bairro = pedido.entrega.bairro;
        }
      } else {
        mapa.set(chave, {
          id: chave,
          nome: pedido.cliente.nome,
          telefone: pedido.cliente.telefone,
          email: pedido.cliente.email,
          bairro: pedido.entrega.bairro,
          pedidos: 1,
          gastoTotal: pedido.total,
          ultimoPedido: pedido.criadoEm,
        });
      }
    });
    return [...mapa.values()].sort((a, b) => b.gastoTotal - a.gastoTotal);
  }, [pedidos]);

  const valor = useMemo(
    () => ({
      produtos,
      pedidos,
      clientes,
      criarPedido,
      atualizarStatus,
      salvarProduto,
      alternarDisponibilidade,
      removerProduto,
      restaurarDados,
    }),
    [
      produtos,
      pedidos,
      clientes,
      criarPedido,
      atualizarStatus,
      salvarProduto,
      alternarDisponibilidade,
      removerProduto,
      restaurarDados,
    ],
  );

  return <LojaContext.Provider value={valor}>{children}</LojaContext.Provider>;
}

export function useLoja() {
  const ctx = useContext(LojaContext);
  if (!ctx) throw new Error("useLoja precisa estar dentro de LojaProvider");
  return ctx;
}
