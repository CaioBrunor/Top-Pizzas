import { ErroHttp } from "../middlewares/erros.js";
import * as Pedido from "../models/Pedido.js";
import * as Usuario from "../models/Usuario.js";
import { esquecerPosicao } from "../services/rastreio.js";
import { gerarHash } from "../services/senha.js";
import { avisarAdmins, desconectarEntregador } from "../services/tempoReal.js";
import { entregadorParaPainel } from "../services/visoes.js";

// Cadastro dos entregadores, feito pelo painel.

const naoEncontrado = () => new ErroHttp(404, "Entregador não encontrado.");

const telefoneEmUso = () =>
  new ErroHttp(409, "Confira os campos destacados.", {
    codigo: "TELEFONE_EM_USO",
    campos: { telefone: "Já existe um entregador com este telefone." },
  });

const comEntregaNaRua = (acao) =>
  new ErroHttp(
    409,
    `Este entregador está com pedido na rua. Troque o entregador do pedido antes de ${acao}.`,
    { codigo: "ENTREGA_EM_ANDAMENTO" },
  );

async function gravar(acao) {
  try {
    return await acao();
  } catch (erro) {
    if (erro instanceof Usuario.TelefoneEmUso) throw telefoneEmUso();
    throw erro;
  }
}

export async function listar(req, res) {
  const entregadores = await Usuario.listarEntregadores();
  res.json({ entregadores: entregadores.map(entregadorParaPainel) });
}

export async function criar(req, res) {
  const { senha, ...dados } = req.dados;
  const entregador = await gravar(async () =>
    Usuario.criar({
      papel: "entregador",
      ...dados,
      senhaHash: await gerarHash(senha),
    }),
  );

  const visao = entregadorParaPainel(entregador);
  avisarAdmins("entregador:salvo", visao);
  res.status(201).json({ entregador: visao });
}

export async function atualizar(req, res) {
  const { senha, ...dados } = req.dados;
  if (!(await Usuario.buscarEntregador(req.params.id))) throw naoEncontrado();

  const entregador = await gravar(async () =>
    Usuario.atualizar(req.params.id, {
      ...dados,
      ...(senha && { senhaHash: await gerarHash(senha) }),
    }),
  );

  const visao = entregadorParaPainel(entregador);
  avisarAdmins("entregador:salvo", visao);
  res.json({ entregador: visao });
}

export async function definirAtivo(req, res) {
  const { ativo } = req.dados;
  const atual = await Usuario.buscarEntregador(req.params.id);
  if (!atual) throw naoEncontrado();
  if (!ativo && (await Pedido.listarEmEntregaCom(atual.id)).length > 0) {
    throw comEntregaNaRua("desativar");
  }

  const entregador = await Usuario.atualizar(atual.id, { ativo });
  // Desativado perde o acesso na hora: o token deixa de valer e a conexão cai.
  if (!ativo) {
    esquecerPosicao(atual.id);
    desconectarEntregador(atual.id);
  }

  const visao = entregadorParaPainel(entregador);
  avisarAdmins("entregador:salvo", visao);
  res.json({ entregador: visao });
}

export async function remover(req, res) {
  const atual = await Usuario.buscarEntregador(req.params.id);
  if (!atual) throw naoEncontrado();
  if ((await Pedido.listarEmEntregaCom(atual.id)).length > 0) {
    throw comEntregaNaRua("excluir");
  }

  await Usuario.remover(atual.id);
  esquecerPosicao(atual.id);
  desconectarEntregador(atual.id);

  avisarAdmins("entregador:removido", { id: atual.id });
  res.status(204).end();
}
