import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { CATEGORIAS } from "../../shared/catalogo.js";
import { ehDuplicado, paraObjeto } from "./util.js";
import * as Meta from "./Meta.js";

const preco = { type: Number, min: 0 };

const produtoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // "margherita", "quatro-queijos"...
    nome: { type: String, required: true, trim: true },
    categoria: {
      type: String,
      required: true,
      enum: CATEGORIAS.map((c) => c.id),
    },
    tipo: { type: String, required: true, enum: ["pizza", "bebida"] },
    imagem: { type: String, default: null },
    descricao: { type: String, default: "" },
    precos: { broto: preco, media: preco, grande: preco, unico: preco },
    tempoPreparo: { type: Number, default: 0, min: 0 },
    disponivel: { type: Boolean, default: true },
    destaque: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    // Posição no cardápio: o produto novo entra no topo (ordem menor).
    ordem: { type: Number, default: 0 },
    criadoEm: { type: String, required: true },
    atualizadoEm: { type: String, required: true },
  },
  { collection: "produtos", versionKey: false },
);

produtoSchema.index({ ordem: 1 });

const Produto = mongoose.model("Produto", produtoSchema);

const converter = (doc) => paraObjeto(doc, { omitir: ["ordem"] });

const slug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const sufixoAleatorio = () => randomBytes(3).toString("hex");

async function idLivre(nome) {
  const base = slug(nome) || `produto-${sufixoAleatorio()}`;
  const usados = new Set(
    (await Produto.find({ _id: new RegExp(`^${base}(-\\d+)?$`) }, { _id: 1 }).lean()).map(
      (p) => p._id,
    ),
  );
  let id = base;
  for (let n = 2; usados.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

export const foiSemeado = () => Meta.foiSemeado("produtos");

export async function listar() {
  const lista = await Produto.find().sort({ ordem: 1, criadoEm: -1 }).lean();
  return lista.map(converter);
}

export async function buscarPorId(id) {
  if (typeof id !== "string" || !id) return null;
  return converter(await Produto.findById(id).lean());
}

export async function criar(dados) {
  const topo = await Produto.findOne().sort({ ordem: 1 }).select("ordem").lean();
  const agora = new Date().toISOString();

  // Dois produtos com o mesmo nome criados juntos disputam o mesmo id: quem
  // perde tenta de novo com o próximo livre.
  for (let tentativa = 1; ; tentativa += 1) {
    try {
      const produto = await Produto.create({
        ...dados,
        _id: await idLivre(dados.nome),
        ordem: (topo?.ordem ?? 0) - 1,
        criadoEm: agora,
        atualizadoEm: agora,
      });
      return converter(produto.toObject());
    } catch (erro) {
      if (!ehDuplicado(erro) || tentativa === 3) throw erro;
    }
  }
}

export async function atualizar(id, alteracoes) {
  if (typeof id !== "string" || !id) return null;

  // `$set` troca o objeto `precos` inteiro: ao mudar de pizza para bebida, os
  // tamanhos antigos somem.
  const atualizado = await Produto.findByIdAndUpdate(
    id,
    { $set: { ...alteracoes, atualizadoEm: new Date().toISOString() } },
    { returnDocument: "after", runValidators: true, lean: true },
  );
  return converter(atualizado);
}

export async function remover(id) {
  if (typeof id !== "string" || !id) return false;
  const apagado = await Produto.findByIdAndDelete(id).lean();
  return apagado !== null;
}

export async function substituirTodos(lista) {
  await Produto.deleteMany({});
  if (lista.length > 0) {
    await Produto.insertMany(
      lista.map(({ id, ...resto }, indice) => ({
        ...resto,
        _id: id,
        ordem: indice,
      })),
    );
  }
  await Meta.marcarSemeado("produtos");
}
