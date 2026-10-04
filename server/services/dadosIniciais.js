import { randomBytes } from "node:crypto";
import { config } from "../config/env.js";
import * as Pedido from "../models/Pedido.js";
import * as Produto from "../models/Produto.js";
import * as Usuario from "../models/Usuario.js";
import { catalogoInicial, gerarDadosDeExemplo } from "./dadosDeExemplo.js";
import { conferirSenha, gerarHash } from "./senha.js";

// O painel tem uma conta só, e ela acompanha o .env: trocar ADMIN_USUARIO ou
// ADMIN_SENHA e reiniciar o servidor atualiza o acesso.
async function garantirAdmin() {
  const { usuario, senha } = config.admin;
  const admin = Usuario.buscarAdmin();

  if (!admin) {
    const senhaInicial = senha ?? randomBytes(9).toString("base64url");
    await Usuario.criar({
      papel: "admin",
      usuario,
      nome: "Gerência",
      senhaHash: await gerarHash(senhaInicial),
    });
    console.log(
      senha
        ? `[dados] conta do painel criada: usuário "${usuario}", senha do .env`
        : `[dados] conta do painel criada: usuário "${usuario}", senha "${senhaInicial}". ` +
            "Anote: ela não aparece de novo. Para escolher a sua, defina ADMIN_SENHA no .env.",
    );
    return;
  }

  const alteracoes = {};
  if (admin.usuario !== usuario) alteracoes.usuario = usuario;
  if (senha && !(await conferirSenha(senha, admin.senhaHash))) {
    alteracoes.senhaHash = await gerarHash(senha);
  }
  if (Object.keys(alteracoes).length > 0) {
    await Usuario.atualizar(admin.id, alteracoes);
    console.log("[dados] acesso do painel atualizado a partir do .env");
  }
}

async function gravarExemplos() {
  const { pedidos, contas } = gerarDadosDeExemplo();

  await Usuario.removerDeExemplo();
  for (const conta of contas) {
    try {
      await Usuario.criar(conta);
    } catch (erro) {
      // Uma conta real já usa este e-mail ou telefone: ela tem prioridade.
      const emUso =
        erro instanceof Usuario.EmailEmUso ||
        erro instanceof Usuario.TelefoneEmUso;
      if (!emUso) throw erro;
    }
  }
  await Pedido.substituirTodos(pedidos);
}

/** Roda uma vez quando o servidor sobe. */
export async function prepararDados() {
  // Lê tudo uma vez para um arquivo de dados quebrado aparecer logo na
  // inicialização, e não no meio de um pedido.
  Usuario.listar();
  Produto.listar();
  Pedido.listar();

  await garantirAdmin();

  if (!Produto.foiSemeado()) {
    await Produto.substituirTodos(catalogoInicial());
    console.log("[dados] cardápio inicial gravado");
  }

  if (!Pedido.foiSemeado()) {
    if (config.dadosDeExemplo) {
      await gravarExemplos();
      console.log("[dados] clientes, entregadores e pedidos de exemplo gravados");
    } else {
      await Pedido.substituirTodos([]);
    }
  }
}

/**
 * Botão "Restaurar dados de exemplo" do painel: o cardápio volta ao original
 * e os pedidos voltam aos de exemplo. As contas reais (clientes e
 * entregadores) continuam.
 */
export async function restaurarDadosDeExemplo() {
  await Produto.substituirTodos(catalogoInicial());
  await gravarExemplos();
}
