import { randomUUID } from "node:crypto";
import { CIDADE } from "../../shared/catalogo.js";
import { criarColecao } from "./colecao.js";

const usuarios = criarColecao("usuarios");

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

// O entregador entra com o telefone, então ele não pode se repetir.
function conferirTelefone(lista, telefone, ignorarId = null) {
  const repetido = lista.some(
    (u) =>
      u.papel === "entregador" && u.telefone === telefone && u.id !== ignorarId,
  );
  if (repetido) throw new TelefoneEmUso();
}

export function listar() {
  return usuarios.ler();
}

export function listarClientes() {
  return usuarios.ler().filter((u) => u.papel === "cliente");
}

export function listarEntregadores() {
  return usuarios.ler().filter((u) => u.papel === "entregador");
}

export function buscarPorId(id) {
  return usuarios.ler().find((u) => u.id === id) ?? null;
}

export function buscarPorEmail(email) {
  return usuarios.ler().find((u) => u.email && u.email === email) ?? null;
}

export function buscarAdmin() {
  return usuarios.ler().find((u) => u.papel === "admin") ?? null;
}

export function buscarEntregador(id) {
  return listarEntregadores().find((u) => u.id === id) ?? null;
}

export function buscarEntregadorPorTelefone(telefone) {
  return listarEntregadores().find((u) => u.telefone === telefone) ?? null;
}

export async function criar(dados) {
  const lista = usuarios.ler();
  // Conferido aqui, junto da gravação, para dois cadastros simultâneos com o
  // mesmo e-mail não passarem os dois.
  if (dados.email && lista.some((u) => u.email === dados.email)) {
    throw new EmailEmUso();
  }
  if (dados.papel === "entregador") conferirTelefone(lista, dados.telefone);

  const agora = new Date().toISOString();
  const usuario = {
    id: dados.id ?? randomUUID(),
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
          usuario: dados.usuario ?? null,
          email: dados.email ?? null,
          endereco: { ...ENDERECO_VAZIO, ...dados.endereco },
        }),
    demo: dados.demo ?? false,
    criadoEm: dados.criadoEm ?? agora,
    atualizadoEm: agora,
    ultimoAcesso: null,
  };

  lista.push(usuario);
  await usuarios.gravar(lista);
  return usuario;
}

export async function atualizar(id, alteracoes) {
  const lista = usuarios.ler();
  const indice = lista.findIndex((u) => u.id === id);
  if (indice === -1) return null;

  const atual = lista[indice];
  if (atual.papel === "entregador" && alteracoes.telefone) {
    conferirTelefone(lista, alteracoes.telefone, id);
  }

  lista[indice] = {
    ...atual,
    ...alteracoes,
    ...(atual.endereco && {
      endereco: { ...atual.endereco, ...alteracoes.endereco },
    }),
    id: atual.id,
    papel: atual.papel,
    atualizadoEm: new Date().toISOString(),
  };

  await usuarios.gravar(lista);
  return lista[indice];
}

export async function remover(id) {
  const lista = usuarios.ler();
  const restante = lista.filter((u) => u.id !== id);
  if (restante.length === lista.length) return false;

  await usuarios.gravar(restante);
  return true;
}

export async function removerDeExemplo() {
  const lista = usuarios.ler();
  await usuarios.gravar(lista.filter((u) => !u.demo));
}

/** O usuário como pode sair do servidor: sem o hash da senha. */
export function publico(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}
