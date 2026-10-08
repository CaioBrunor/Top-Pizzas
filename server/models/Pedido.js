import mongoose from "mongoose";
import { BORDAS, TAMANHOS } from "../../shared/catalogo.js";
import { METODOS_PAGAMENTO, STATUS_PEDIDO } from "../../shared/pedidos.js";
import * as Meta from "./Meta.js";
import { ehDuplicado, paraObjeto } from "./util.js";

const sub = (definicao) => new mongoose.Schema(definicao, { _id: false });

const clienteSchema = sub({ nome: String, telefone: String, email: String });

const entregaSchema = sub({
  tipo: { type: String, enum: ["entrega", "retirada"] },
  cep: String,
  rua: String,
  numero: String,
  bairro: String,
  complemento: String,
  cidade: String,
});

const pagamentoSchema = sub({
  metodo: { type: String, enum: METODOS_PAGAMENTO },
  troco: { type: Number, default: null },
});

const itemSchema = sub({
  linhaId: String,
  produtoId: String,
  nome: String,
  tamanho: { type: String, enum: [...TAMANHOS.map((t) => t.id), "unico"] },
  tamanhoNome: String,
  borda: { type: String, enum: BORDAS.map((b) => b.id) },
  bordaNome: String,
  observacao: { type: String, default: "" },
  quantidade: { type: Number, min: 1 },
  precoUnitario: Number,
});

const entregadorSchema = sub({ id: String, nome: String, veiculo: String, placa: String });
const confirmacaoSchema = sub({ tipo: { type: String, enum: ["codigo", "painel"] }, em: String });
const historicoSchema = sub({ status: String, em: String });

const pedidoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // "TP-1000"
    criadoEm: { type: String, required: true },
    atualizadoEm: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: STATUS_PEDIDO.map((s) => s.id),
    },
    origem: { type: String, default: "site" },
    clienteId: { type: String, required: true },
    cliente: clienteSchema,
    entrega: entregaSchema,
    pagamento: pagamentoSchema,
    itens: [itemSchema],
    subtotal: Number,
    taxaEntrega: Number,
    total: { type: Number, required: true },
    codigoEntrega: { type: String, default: null },
    entregador: { type: entregadorSchema, default: null },
    confirmacao: { type: confirmacaoSchema, default: null },
    historico: [historicoSchema],
  },
  { collection: "pedidos", versionKey: false },
);

pedidoSchema.index({ criadoEm: -1 });
pedidoSchema.index({ clienteId: 1, criadoEm: -1 });
pedidoSchema.index({ status: 1, "entregador.id": 1 });

const Pedido = mongoose.model("Pedido", pedidoSchema);

const PRIMEIRO_NUMERO = 1000;
const SEQUENCIA = "pedidos";

const numeroDe = (id) => Number.parseInt(String(id).replace(/\D/g, ""), 10) || 0;
const maisRecentePrimeiro = { criadoEm: -1 };

// O número vem de um contador próprio, e não da quantidade de pedidos, para um
// código nunca ser reaproveitado depois de restaurar os dados de exemplo.
async function sincronizarSequencia() {
  const ids = await Pedido.find({}, { _id: 1 }).lean();
  const maior = ids.reduce((n, p) => Math.max(n, numeroDe(p._id)), 0);
  await Meta.garantirSequenciaMinima(SEQUENCIA, Math.max(maior, PRIMEIRO_NUMERO - 1));
}

export const foiSemeado = () => Meta.foiSemeado("pedidos");

export const sincronizarCodigos = sincronizarSequencia;

export async function listar() {
  const lista = await Pedido.find().sort(maisRecentePrimeiro).lean();
  return lista.map(paraObjeto);
}

export async function listarDoCliente(clienteId) {
  const lista = await Pedido.find({ clienteId }).sort(maisRecentePrimeiro).lean();
  return lista.map(paraObjeto);
}

export async function buscarPorId(id) {
  if (typeof id !== "string" || !id) return null;
  return paraObjeto(await Pedido.findById(id).lean());
}

export async function criar(dados) {
  const agora = new Date().toISOString();

  for (let tentativa = 1; ; tentativa += 1) {
    const numero = await Meta.proximoNumero(SEQUENCIA);
    try {
      const pedido = await Pedido.create({
        ...dados,
        _id: `TP-${numero}`,
        criadoEm: agora,
        atualizadoEm: agora,
        status: "recebido",
        origem: "site",
        historico: [{ status: "recebido", em: agora }],
      });
      return paraObjeto(pedido.toObject());
    } catch (erro) {
      if (!ehDuplicado(erro) || tentativa === 3) throw erro;
      await sincronizarSequencia();
    }
  }
}

export async function listarEmEntregaCom(entregadorId) {
  if (typeof entregadorId !== "string" || !entregadorId) return [];
  const lista = await Pedido.find({
    status: "entrega",
    "entregador.id": entregadorId,
  })
    .sort(maisRecentePrimeiro)
    .lean();
  return lista.map(paraObjeto);
}

export async function listarConcluidasDesde(entregadorId, desde) {
  const lista = await Pedido.find({
    status: "entregue",
    "entregador.id": entregadorId,
    "confirmacao.em": { $gte: desde },
  })
    .sort(maisRecentePrimeiro)
    .lean();
  return lista.map(paraObjeto);
}

/**
 * Total de pedidos e valor gasto (sem os cancelados) e data do último pedido
 * (cancelado ou não), por cliente. Lê só os 4 campos necessários de cada
 * pedido, sem os itens. Se o volume crescer muito, vale trocar por um
 * `aggregate` com `$group`.
 */
export async function resumoPorCliente() {
  const pedidos = await Pedido.find(
    {},
    { clienteId: 1, status: 1, total: 1, criadoEm: 1 },
  )
    .sort(maisRecentePrimeiro)
    .lean();

  const resumos = new Map();
  for (const { clienteId, status, total, criadoEm } of pedidos) {
    // Os pedidos vêm do mais recente para o mais antigo: o primeiro de cada
    // cliente é o último que ele fez.
    const resumo =
      resumos.get(clienteId) ??
      resumos.set(clienteId, { pedidos: 0, gastoTotal: 0, ultimoPedido: criadoEm }).get(clienteId);

    if (status !== "cancelado") {
      resumo.pedidos += 1;
      resumo.gastoTotal += total;
    }
  }
  return resumos;
}

export async function atualizarStatus(id, status, alteracoes = {}) {
  if (typeof id !== "string" || !id) return null;

  const agora = new Date().toISOString();
  const atualizado = await Pedido.findByIdAndUpdate(
    id,
    {
      $set: { ...alteracoes, status, atualizadoEm: agora },
      $push: { historico: { status, em: agora } },
    },
    { returnDocument: "after", runValidators: true, lean: true },
  );
  return paraObjeto(atualizado);
}

export async function atualizar(id, alteracoes) {
  if (typeof id !== "string" || !id) return null;

  const { id: _id, status: _status, ...resto } = alteracoes;
  const atualizado = await Pedido.findByIdAndUpdate(
    id,
    { $set: { ...resto, atualizadoEm: new Date().toISOString() } },
    { returnDocument: "after", runValidators: true, lean: true },
  );
  return paraObjeto(atualizado);
}

export async function substituirTodos(lista) {
  await Pedido.deleteMany({});
  if (lista.length > 0) {
    await Pedido.insertMany(lista.map(({ id, ...resto }) => ({ ...resto, _id: id })));
  }
  await sincronizarSequencia();
  await Meta.marcarSemeado("pedidos");
}
