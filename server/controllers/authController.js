import { ErroHttp } from "../middlewares/erros.js";
import * as Usuario from "../models/Usuario.js";
import { conferirSenha, gerarHash } from "../services/senha.js";
import { avisarAdmins } from "../services/tempoReal.js";
import { emitirToken } from "../services/token.js";

// A mesma mensagem para e-mail desconhecido e senha errada, para a resposta
// não revelar quais contas existem.
const credenciaisInvalidas = (mensagem) =>
  new ErroHttp(401, mensagem, { codigo: "CREDENCIAIS_INVALIDAS" });

const emailEmUso = () =>
  new ErroHttp(409, "Confira os campos destacados.", {
    codigo: "EMAIL_EM_USO",
    campos: { email: "Este e-mail já tem cadastro. Tente entrar." },
  });

async function abrirSessao(res, usuario, status = 200) {
  const atual = await Usuario.atualizar(usuario.id, {
    ultimoAcesso: new Date().toISOString(),
  });
  const publico = Usuario.publico(atual);

  if (publico.papel === "cliente") avisarAdmins("cliente:salvo", publico);
  res.status(status).json({ token: emitirToken(atual), usuario: publico });
}

export async function cadastrar(req, res) {
  const { nome, email, telefone, senha } = req.dados;
  if (await Usuario.buscarPorEmail(email)) throw emailEmUso();

  let usuario;
  try {
    usuario = await Usuario.criar({
      papel: "cliente",
      nome,
      email,
      telefone,
      senhaHash: await gerarHash(senha),
    });
  } catch (erro) {
    if (erro instanceof Usuario.EmailEmUso) throw emailEmUso();
    throw erro;
  }

  await abrirSessao(res, usuario, 201);
}

export async function entrar(req, res) {
  const { email, senha } = req.dados;
  const conta = await Usuario.buscarPorEmail(email);
  const cliente = conta?.papel === "cliente" ? conta : null;

  if (!(await conferirSenha(senha, cliente?.senhaHash))) {
    throw credenciaisInvalidas("E-mail ou senha não conferem.");
  }
  await abrirSessao(res, cliente);
}

export async function entrarAdmin(req, res) {
  const { usuario, senha } = req.dados;
  const admin = await Usuario.buscarAdmin();
  const hash = admin?.usuario === usuario ? admin.senhaHash : null;

  if (!(await conferirSenha(senha, hash))) {
    throw credenciaisInvalidas("Usuário ou senha não conferem.");
  }
  await abrirSessao(res, admin);
}

export async function entrarEntregador(req, res) {
  const { telefone, senha } = req.dados;
  const conta = await Usuario.buscarEntregadorPorTelefone(telefone);
  const entregador = conta?.ativo ? conta : null;

  if (!(await conferirSenha(senha, entregador?.senhaHash))) {
    throw credenciaisInvalidas("Telefone ou senha não conferem.");
  }
  await abrirSessao(res, entregador);
}

export function eu(req, res) {
  res.json({ usuario: req.usuario });
}

export async function atualizarPerfil(req, res) {
  const { nome, telefone, endereco } = req.dados;
  const usuario = Usuario.publico(
    await Usuario.atualizar(req.usuario.id, { nome, telefone, endereco }),
  );

  avisarAdmins("cliente:salvo", usuario);
  res.json({ usuario });
}
