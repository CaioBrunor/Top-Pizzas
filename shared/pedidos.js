export const STATUS_PEDIDO = [
  { id: "recebido", nome: "Recebido", cor: "selo--ambar" },
  { id: "preparo", nome: "Em preparo", cor: "selo--ambar" },
  { id: "forno", nome: "No forno", cor: "selo--quente" },
  { id: "entrega", nome: "Saiu para entrega", cor: "selo--quente" },
  { id: "entregue", nome: "Entregue", cor: "selo--basil" },
  { id: "cancelado", nome: "Cancelado", cor: "selo--danger" },
];

export const FLUXO_STATUS = [
  "recebido",
  "preparo",
  "forno",
  "entrega",
  "entregue",
];

export const METODOS_PAGAMENTO = ["pix", "cartao", "dinheiro"];

export function statusInfo(id) {
  return STATUS_PEDIDO.find((s) => s.id === id) ?? STATUS_PEDIDO[0];
}

export function proximoStatus(id) {
  const i = FLUXO_STATUS.indexOf(id);
  if (i === -1 || i === FLUXO_STATUS.length - 1) return null;
  return FLUXO_STATUS[i + 1];
}

export const pedidoEmAberto = (status) =>
  status !== "entregue" && status !== "cancelado";

export const ehEntrega = (pedido) => pedido.entrega?.tipo === "entrega";

const NOMES_NA_RETIRADA = {
  entrega: "Pronto para retirar",
  entregue: "Retirado",
};

export function etapaDoPedido(pedido, status = pedido.status) {
  const info = statusInfo(status);
  const nome = ehEntrega(pedido) ? null : NOMES_NA_RETIRADA[status];
  return nome ? { ...info, nome } : info;
}

export const DIGITOS_DO_CODIGO = 4;

// O painel só pode avançar um passo, cancelar um pedido em aberto ou reabrir
// um pedido encerrado. O servidor recusa qualquer outro salto.
export function transicaoPermitida(de, para) {
  if (para === proximoStatus(de)) return true;
  if (para === "cancelado") return pedidoEmAberto(de);
  if (para === "recebido") return !pedidoEmAberto(de);
  return false;
}
