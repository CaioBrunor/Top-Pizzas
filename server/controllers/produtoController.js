import { ErroHttp } from "../middlewares/erros.js";
import * as Produto from "../models/Produto.js";
import { avisarTodos } from "../services/tempoReal.js";

const produtoNaoEncontrado = () =>
  new ErroHttp(404, "Este produto não existe mais no cardápio.");

export function listar(req, res) {
  res.json({ produtos: Produto.listar() });
}

export function detalhar(req, res) {
  const produto = Produto.buscarPorId(req.params.id);
  if (!produto) throw produtoNaoEncontrado();
  res.json({ produto });
}

export async function criar(req, res) {
  const produto = await Produto.criar(req.dados);
  avisarTodos("produto:salvo", produto);
  res.status(201).json({ produto });
}

export async function atualizar(req, res) {
  const produto = await Produto.atualizar(req.params.id, req.dados);
  if (!produto) throw produtoNaoEncontrado();

  avisarTodos("produto:salvo", produto);
  res.json({ produto });
}

export async function definirDisponibilidade(req, res) {
  const produto = await Produto.atualizar(req.params.id, {
    disponivel: req.dados.disponivel,
  });
  if (!produto) throw produtoNaoEncontrado();

  avisarTodos("produto:salvo", produto);
  res.json({ produto });
}

export async function remover(req, res) {
  const removido = await Produto.remover(req.params.id);
  if (!removido) throw produtoNaoEncontrado();

  avisarTodos("produto:removido", { id: req.params.id });
  res.status(204).end();
}
