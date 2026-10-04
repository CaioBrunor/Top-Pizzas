import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BORDAS,
  TAMANHOS,
  TAXA_ENTREGA,
  calcularPrecoUnitario,
} from "../data/catalogo";
import { ler, gravar } from "../lib/persistencia";
import { useLoja } from "./LojaContext";

const CarrinhoContext = createContext(null);

const chaveLinha = (produtoId, tamanho, borda, observacao) =>
  `${produtoId}|${tamanho}|${borda}|${observacao.trim().toLowerCase()}`;

// O carrinho fica dias guardado no navegador e o cardápio muda nesse meio
// tempo. Aqui cada linha é conferida com o cardápio atual: sai o que não
// existe mais e o preço acompanha o do servidor.
function conferirComCardapio(itens, produtos) {
  let removidos = 0;
  let alterados = 0;

  const conferidos = itens.flatMap((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);
    const preco =
      produto?.disponivel &&
      calcularPrecoUnitario(produto, item.tamanho, item.borda);
    if (!preco) {
      removidos += 1;
      return [];
    }
    if (preco === item.precoUnitario && produto.nome === item.nome) return [item];

    alterados += 1;
    return [{ ...item, nome: produto.nome, precoUnitario: preco }];
  });

  return { conferidos, removidos, alterados };
}

export function CarrinhoProvider({ children }) {
  const { produtos, catalogoSincronizado } = useLoja();
  const [itens, setItens] = useState(() => ler("carrinho", []));
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [modoEntrega, setModoEntrega] = useState(() =>
    ler("modoEntrega", "entrega"),
  );

  useEffect(() => gravar("carrinho", itens), [itens]);
  useEffect(() => gravar("modoEntrega", modoEntrega), [modoEntrega]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  // Só confere depois que o cardápio do servidor chegou: a cópia guardada no
  // navegador pode estar velha.
  useEffect(() => {
    if (!catalogoSincronizado) return;
    const { conferidos, removidos, alterados } = conferirComCardapio(
      itens,
      produtos,
    );
    if (removidos + alterados === 0) return;

    setItens(conferidos);
    setAviso(
      removidos > 0
        ? "Um item saiu do cardápio e foi tirado do carrinho"
        : "O cardápio mudou: valores do carrinho atualizados",
    );
  }, [itens, produtos, catalogoSincronizado]);

  const adicionar = useCallback(
    (produto, { tamanho, borda, quantidade, observacao }) => {
      const tam = TAMANHOS.find((t) => t.id === tamanho);
      const brd = BORDAS.find((b) => b.id === borda) ?? BORDAS[0];
      const precoUnitario = calcularPrecoUnitario(produto, tamanho, brd.id);
      if (precoUnitario === null) return;
      const linhaId = chaveLinha(produto.id, tamanho, brd.id, observacao ?? "");

      setItens((atual) => {
        const existente = atual.find((i) => i.linhaId === linhaId);
        if (existente) {
          return atual.map((i) =>
            i.linhaId === linhaId
              ? { ...i, quantidade: i.quantidade + quantidade }
              : i,
          );
        }
        return [
          ...atual,
          {
            linhaId,
            produtoId: produto.id,
            nome: produto.nome,
            tipo: produto.tipo,
            tamanho,
            tamanhoNome:
              produto.tipo === "bebida" ? "Unidade" : (tam?.nome ?? ""),
            borda: brd.id,
            bordaNome: produto.tipo === "bebida" ? "" : brd.nome,
            observacao: observacao ?? "",
            quantidade,
            precoUnitario,
          },
        ];
      });

      setAviso(`${produto.nome} entrou no carrinho`);
    },
    [],
  );

  const alterarQuantidade = useCallback((linhaId, delta) => {
    setItens((atual) =>
      atual
        .map((i) =>
          i.linhaId === linhaId
            ? { ...i, quantidade: i.quantidade + delta }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }, []);

  const remover = useCallback((linhaId) => {
    setItens((atual) => atual.filter((i) => i.linhaId !== linhaId));
  }, []);

  const esvaziar = useCallback(() => setItens([]), []);

  const valor = useMemo(() => {
    const subtotal = itens.reduce(
      (s, i) => s + i.precoUnitario * i.quantidade,
      0,
    );
    const quantidadeTotal = itens.reduce((s, i) => s + i.quantidade, 0);
    const taxaEntrega =
      modoEntrega === "retirada" || itens.length === 0 ? 0 : TAXA_ENTREGA;

    return {
      itens,
      subtotal,
      taxaEntrega,
      total: subtotal + taxaEntrega,
      quantidadeTotal,
      vazio: itens.length === 0,
      aberto,
      aviso,
      modoEntrega,
      setModoEntrega,
      abrir: () => setAberto(true),
      fechar: () => setAberto(false),
      adicionar,
      alterarQuantidade,
      remover,
      esvaziar,
    };
  }, [
    itens,
    aberto,
    aviso,
    modoEntrega,
    adicionar,
    alterarQuantidade,
    remover,
    esvaziar,
  ]);

  return (
    <CarrinhoContext.Provider value={valor}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx)
    throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
