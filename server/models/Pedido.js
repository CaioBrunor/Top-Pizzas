import { localStorage } from "../storage/index.js";
import { criarColecao } from "./colecao.js";

const pedidos = criarColecao("pedidos");

const CHAVE_SEQUENCIA = "sequencia-pedidos";
const PRIMEIRO_NUMERO = 1000;

const maisRecentePrimeiro = (a, b) => (a.criadoEm < b.criadoEm ? 1 : -1);
const numeroDe = (id) => Number.parseInt(String(id).replace(/\D/g, ""), 10) || 0;

// O número vem de um contador próprio, e não do tamanho da lista, para um
// código nunca ser reaproveitado depois de restaurar os dados de exemplo.
function proximoCodigo(lista) {
  const salvo = Number.parseInt(localStorage.getItem(CHAVE_SEQUENCIA) ?? "", 10);
  const maior = lista.reduce((n, p) => Math.max(n, numeroDe(p.id)), 0);
  const numero = Math.max(salvo || 0, maior + 1, PRIMEIRO_NUMERO);

  localStorage.setItem(CHAVE_SEQUENCIA, String(numero + 1));
  return `TP-${numero}`;
}

export const foiSemeado = () => pedidos.existe();

export function listar() {
  return pedidos.ler().sort(maisRecentePrimeiro);
}

export function listarDoCliente(clienteId) {
  return listar().filter((p) => p.clienteId === clienteId);
}

export function buscarPorId(id) {
  return pedidos.ler().find((p) => p.id === id) ?? null;
}

export async function criar(dados) {
  const lista = pedidos.ler();
  const agora = new Date().toISOString();
  const pedido = {
    ...dados,
    id: proximoCodigo(lista),
    criadoEm: agora,
    atualizadoEm: agora,
    status: "recebido",
    origem: "site",
    historico: [{ status: "recebido", em: agora }],
  };

  lista.push(pedido);
  await pedidos.gravar(lista);
  return pedido;
}

export function listarEmEntregaCom(entregadorId) {
  return listar().filter(
    (p) => p.status === "entrega" && p.entregador?.id === entregadorId,
  );
}

/** Muda a etapa do pedido. `alteracoes` leva o que muda junto (entregador...). */
export async function atualizarStatus(id, status, alteracoes = {}) {
  const lista = pedidos.ler();
  const pedido = lista.find((p) => p.id === id);
  if (!pedido) return null;

  const agora = new Date().toISOString();
  Object.assign(pedido, alteracoes, { status, atualizadoEm: agora });
  pedido.historico = [...(pedido.historico ?? []), { status, em: agora }];

  await pedidos.gravar(lista);
  return pedido;
}

/** Altera dados do pedido sem mudar a etapa. */
export async function atualizar(id, alteracoes) {
  const lista = pedidos.ler();
  const pedido = lista.find((p) => p.id === id);
  if (!pedido) return null;

  Object.assign(pedido, alteracoes, {
    id,
    status: pedido.status,
    atualizadoEm: new Date().toISOString(),
  });

  await pedidos.gravar(lista);
  return pedido;
}

export async function substituirTodos(lista) {
  await pedidos.gravar(lista);
}
