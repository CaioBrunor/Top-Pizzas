import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { CIDADE } from "../../shared/catalogo.js";
import { ehDuplicado, paraObjeto, semIndefinidos } from "./util.js";

const enderecoSchema = new mongoose.Schema(
  {
    cep: String,
    rua: String,
    numero: String,
    bairro: String,
    complemento: String,
    cidade: String,
  },
  { _id: false },
);

// Clientes, entregadores e a conta do painel ficam na mesma coleção, separados
// pelo `papel`. Cada papel guarda só o que usa, como antes.
const usuarioSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    papel: {
      type: String,
      required: true,
      enum: ["cliente", "entregador", "admin"],
    },
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, default: "" },
    senhaHash: { type: String, default: null },

    // cliente e admin
    usuario: { type: String, default: undefined },
    email: { type: String, default: undefined },
    endereco: { type: enderecoSchema, default: undefined },

    // entregador
    veiculo: { type: String, default: undefined },
    placa: { type: String, default: undefined },
    ativo: { type: Boolean, default: undefined },

    demo: { type: Boolean, default: false },
    criadoEm: { type: String, required: true },
    atualizadoEm: { type: String, required: true },
    ultimoAcesso: { type: String, default: null },
  },
  { collection: "usuarios", versionKey: false },
);

// O banco também garante que e-mail e telefone de entregador não se repetem,
// mesmo com dois cadastros chegando ao mesmo tempo.
usuarioSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);
usuarioSchema.index(
  { telefone: 1 },
  { unique: true, partialFilterExpression: { papel: "entregador" } },
);
usuarioSchema.index({ papel: 1 });

const Usuario = mongoose.model("Usuario", usuarioSchema);

const ENDERECO_VAZIO = {
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  complemento: "",
  cidade: CIDADE,
};

export class EmailEmUso extends Error {
  constructor() {
    super("Este e-mail já tem cadastro.");
  }
}

export class TelefoneEmUso extends Error {
  constructor() {
    super("Já existe um entregador com este telefone.");
  }
}

const texto = (valor) => typeof valor === "string" && valor !== "";

// O entregador entra com o telefone, então ele não pode se repetir.
async function conferirTelefone(telefone, ignorarId = null) {
  const repetido = await Usuario.exists({
    papel: "entregador",
    telefone,
    ...(ignorarId && { _id: { $ne: ignorarId } }),
  });
  if (repetido) throw new TelefoneEmUso();
}

// Traduz o erro de índice único do banco para o erro que o resto do servidor
// já conhece.
function traduzirDuplicado(erro) {
  if (!ehDuplicado(erro)) return erro;
  return "email" in (erro.keyPattern ?? {}) ? new EmailEmUso() : new TelefoneEmUso();
}

async function buscar(filtro) {
  return paraObjeto(await Usuario.findOne(filtro).lean());
}

async function listarPor(filtro) {
  const lista = await Usuario.find(filtro).sort({ criadoEm: 1 }).lean();
  return lista.map(paraObjeto);
}

export const listar = () => listarPor({});
export const listarClientes = () => listarPor({ papel: "cliente" });
export const listarEntregadores = () => listarPor({ papel: "entregador" });

export async function buscarPorId(id) {
  return texto(id) ? buscar({ _id: id }) : null;
}

export async function buscarPorEmail(email) {
  return texto(email) ? buscar({ email }) : null;
}

export const buscarAdmin = () => buscar({ papel: "admin" });

export async function buscarEntregador(id) {
  return texto(id) ? buscar({ _id: id, papel: "entregador" }) : null;
}

export async function buscarEntregadorPorTelefone(telefone) {
  return texto(telefone) ? buscar({ papel: "entregador", telefone }) : null;
}

export async function criar(dados) {
  if (texto(dados.email) && (await Usuario.exists({ email: dados.email }))) {
    throw new EmailEmUso();
  }
  if (dados.papel === "entregador") await conferirTelefone(dados.telefone);

  const agora = new Date().toISOString();
  try {
    const usuario = await Usuario.create({
      _id: dados.id ?? randomUUID(),
      papel: dados.papel,
      nome: dados.nome,
      telefone: dados.telefone ?? "",
      senhaHash: dados.senhaHash ?? null,
      // Cada papel guarda só o que usa.
      ...(dados.papel === "entregador"
        ? {
            veiculo: dados.veiculo ?? "",
            placa: dados.placa ?? "",
            ativo: dados.ativo ?? true,
          }
        : {
            usuario: dados.usuario ?? undefined,
            email: dados.email ?? undefined,
            endereco: { ...ENDERECO_VAZIO, ...dados.endereco },
          }),
      demo: dados.demo ?? false,
      criadoEm: dados.criadoEm ?? agora,
      atualizadoEm: agora,
      ultimoAcesso: null,
    });
    return paraObjeto(usuario.toObject());
  } catch (erro) {
    throw traduzirDuplicado(erro);
  }
}

export async function atualizar(id, alteracoes) {
  if (!texto(id)) return null;

  // `id` e `papel` nunca mudam. O endereço é mesclado campo a campo.
  const { id: _id, papel: _papel, endereco, ...resto } = alteracoes;
  const mudanca = semIndefinidos({
    ...resto,
    atualizadoEm: new Date().toISOString(),
  });
  for (const [campo, valor] of Object.entries(semIndefinidos(endereco ?? {}))) {
    mudanca[`endereco.${campo}`] = valor;
  }

  if (texto(resto.telefone)) {
    const atual = await Usuario.findById(id, { papel: 1 }).lean();
    if (atual?.papel === "entregador") await conferirTelefone(resto.telefone, id);
  }

  try {
    const atualizado = await Usuario.findByIdAndUpdate(
      id,
      { $set: mudanca },
      { returnDocument: "after", runValidators: true, lean: true },
    );
    return paraObjeto(atualizado);
  } catch (erro) {
    throw traduzirDuplicado(erro);
  }
}

export async function remover(id) {
  if (!texto(id)) return false;
  const apagado = await Usuario.findByIdAndDelete(id).lean();
  return apagado !== null;
}

export async function removerDeExemplo() {
  await Usuario.deleteMany({ demo: true });
}

/** O usuário como pode sair do servidor: sem o hash da senha. */
export function publico(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}
