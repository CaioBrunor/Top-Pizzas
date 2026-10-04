import {
  BORDAS,
  CIDADE,
  PEDIDO_MINIMO,
  TAMANHOS,
  TAXA_ENTREGA,
  arredondar,
  calcularPrecoUnitario,
} from "../../shared/catalogo.js";
import { ErroHttp } from "../middlewares/erros.js";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const SEM_ENDERECO = { cep: "", rua: "", numero: "", bairro: "", complemento: "" };

/**
 * Monta os itens e os valores do pedido a partir do cardápio salvo no
 * servidor. Do carrinho enviado pelo site só são aproveitados o produto, o
 * tamanho, a borda, a quantidade e a observação: nome e preço nunca vêm do
 * cliente, então não adianta alterar o valor no navegador.
 */
export function montarPedido({ itens, entrega, pagamento }, produtos) {
  const linhas = new Map();

  for (const item of itens) {
    const produto = produtos.find((p) => p.id === item.produtoId);
    if (!produto) {
      throw new ErroHttp(409, "Um item do carrinho não existe mais no cardápio.", {
        codigo: "CARDAPIO_ALTERADO",
      });
    }
    if (!produto.disponivel) {
      throw new ErroHttp(409, `${produto.nome} saiu do cardápio de hoje.`, {
        codigo: "CARDAPIO_ALTERADO",
      });
    }

    const ehBebida = produto.tipo === "bebida";
    const tamanho = ehBebida ? "unico" : item.tamanho;
    const borda = ehBebida ? "sem" : item.borda;
    const precoUnitario = calcularPrecoUnitario(produto, tamanho, borda);
    if (precoUnitario === null) {
      throw new ErroHttp(422, `Escolha um tamanho válido para ${produto.nome}.`, {
        codigo: "ITEM_INVALIDO",
      });
    }

    const linhaId = `${produto.id}|${tamanho}|${borda}|${item.observacao.toLowerCase()}`;
    const repetida = linhas.get(linhaId);
    if (repetida) {
      repetida.quantidade += item.quantidade;
      continue;
    }

    linhas.set(linhaId, {
      linhaId,
      produtoId: produto.id,
      nome: produto.nome,
      tamanho,
      tamanhoNome: ehBebida ? "Unidade" : TAMANHOS.find((t) => t.id === tamanho).nome,
      borda,
      bordaNome: ehBebida ? "" : BORDAS.find((b) => b.id === borda).nome,
      observacao: item.observacao,
      quantidade: item.quantidade,
      precoUnitario,
    });
  }

  const itensDoPedido = [...linhas.values()];
  const subtotal = arredondar(
    itensDoPedido.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0),
  );
  if (subtotal < PEDIDO_MINIMO) {
    throw new ErroHttp(422, `O pedido mínimo é de ${moeda(PEDIDO_MINIMO)}.`, {
      codigo: "PEDIDO_MINIMO",
    });
  }

  const retirada = entrega.tipo === "retirada";
  const taxaEntrega = retirada ? 0 : TAXA_ENTREGA;
  const total = arredondar(subtotal + taxaEntrega);

  const troco = pagamento.metodo === "dinheiro" ? pagamento.troco : null;
  if (troco !== null && troco < total) {
    throw new ErroHttp(422, "Confira os campos destacados.", {
      campos: { "pagamento.troco": `Precisa ser pelo menos ${moeda(total)}.` },
    });
  }

  return {
    itens: itensDoPedido,
    entrega: { ...SEM_ENDERECO, ...entrega, cidade: CIDADE },
    pagamento: { metodo: pagamento.metodo, troco },
    subtotal,
    taxaEntrega,
    total,
  };
}
