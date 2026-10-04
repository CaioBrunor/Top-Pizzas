import { randomBytes } from "node:crypto";
import { criarColecao } from "./colecao.js";

const produtos = criarColecao("produtos");

const slug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function idLivre(nome, lista) {
  const base = slug(nome) || `produto-${randomBytes(3).toString("hex")}`;
  let id = base;
  for (let n = 2; lista.some((p) => p.id === id); n += 1) id = `${base}-${n}`;
  return id;
}

export const foiSemeado = () => produtos.existe();

export function listar() {
  return produtos.ler();
}

export function buscarPorId(id) {
  return produtos.ler().find((p) => p.id === id) ?? null;
}

export async function criar(dados) {
  const lista = produtos.ler();
  const agora = new Date().toISOString();
  const produto = {
    ...dados,
    id: idLivre(dados.nome, lista),
    criadoEm: agora,
    atualizadoEm: agora,
  };

  lista.unshift(produto);
  await produtos.gravar(lista);
  return produto;
}

export async function atualizar(id, alteracoes) {
  const lista = produtos.ler();
  const indice = lista.findIndex((p) => p.id === id);
  if (indice === -1) return null;

  lista[indice] = {
    ...lista[indice],
    ...alteracoes,
    id,
    atualizadoEm: new Date().toISOString(),
  };

  await produtos.gravar(lista);
  return lista[indice];
}

export async function remover(id) {
  const lista = produtos.ler();
  const restante = lista.filter((p) => p.id !== id);
  if (restante.length === lista.length) return false;

  await produtos.gravar(restante);
  return true;
}

export async function substituirTodos(lista) {
  await produtos.gravar(lista);
}
