import {
  ehEntrega,
  etapaDoPedido,
  transicaoPermitida,
} from "../../shared/pedidos.js";
import { ErroHttp } from "../middlewares/erros.js";
import * as Pedido from "../models/Pedido.js";
import * as Produto from "../models/Produto.js";
import * as Usuario from "../models/Usuario.js";
import { esquecerErros, gerarCodigo } from "../services/codigoDeEntrega.js";
import { pararDeRastrearSeLivre } from "../services/entregas.js";
import { montarPedido } from "../services/montarPedido.js";
import { avisarAdmins, avisarPedido } from "../services/tempoReal.js";
import {
  pedidoParaCliente,
  pedidoParaPainel,
  resumoDoEntregador,
} from "../services/visoes.js";

const pedidoNaoEncontrado = () => new ErroHttp(404, "Pedido não encontrado.");

// Só entregador ativo pode receber um pedido.
function entregadorDisponivel(id) {
  const entregador = id ? Usuario.buscarEntregador(id) : null;
  if (!entregador?.ativo) {
    throw new ErroHttp(422, "Confira os campos destacados.", {
      campos: {
        entregadorId: id
          ? "Este entregador não está mais disponível."
          : "Escolha quem vai levar o pedido.",
      },
    });
  }
  return entregador;
}

export async function criar(req, res) {
  const { contato, totalEsperado, ...carrinho } = req.dados;
  const montado = montarPedido(carrinho, Produto.listar());

  if (
    totalEsperado !== undefined &&
    Math.abs(totalEsperado - montado.total) > 0.005
  ) {
    throw new ErroHttp(
      409,
      "O cardápio mudou enquanto você montava o pedido. Confira os valores e confirme de novo.",
      { codigo: "CARDAPIO_ALTERADO" },
    );
  }

  const pedido = await Pedido.criar({
    clienteId: req.usuario.id,
    cliente: {
      nome: contato.nome,
      telefone: contato.telefone,
      email: req.usuario.email,
    },
    ...montado,
    // O código que o cliente informa ao entregador na hora de receber.
    codigoEntrega: montado.entrega.tipo === "entrega" ? gerarCodigo() : null,
    entregador: null,
    confirmacao: null,
  });

  // O telefone e o endereço usados agora passam a ser os dados atuais do
  // cliente: é o que aparece no painel e no próximo pedido dele.
  const { cidade, tipo, ...endereco } = montado.entrega;
  const usuario = Usuario.publico(
    await Usuario.atualizar(req.usuario.id, {
      telefone: contato.telefone,
      ...(tipo === "entrega" && { endereco }),
    }),
  );

  avisarPedido("criado", pedido);
  avisarAdmins("cliente:salvo", usuario);
  res.status(201).json({ pedido: pedidoParaCliente(pedido), usuario });
}

export function listar(req, res) {
  res.json({ pedidos: Pedido.listar().map(pedidoParaPainel) });
}

export function listarMeus(req, res) {
  res.json({
    pedidos: Pedido.listarDoCliente(req.usuario.id).map(pedidoParaCliente),
  });
}

export function detalhar(req, res) {
  const pedido = Pedido.buscarPorId(req.params.id);
  const ehAdmin = req.usuario.papel === "admin";
  const ehDono = pedido?.clienteId === req.usuario.id;

  // Pedido de outra pessoa responde igual a pedido inexistente, para não
  // confirmar quais códigos existem.
  if (!pedido || !(ehAdmin || ehDono)) throw pedidoNaoEncontrado();
  res.json({
    pedido: ehDono ? pedidoParaCliente(pedido) : pedidoParaPainel(pedido),
  });
}

export async function atualizarStatus(req, res) {
  const { status, entregadorId } = req.dados;
  const atual = Pedido.buscarPorId(req.params.id);
  if (!atual) throw pedidoNaoEncontrado();

  if (atual.status === status) {
    res.json({ pedido: pedidoParaPainel(atual) });
    return;
  }
  if (!transicaoPermitida(atual.status, status)) {
    throw new ErroHttp(
      409,
      `Este pedido está como "${etapaDoPedido(atual).nome}" e não pode ir direto para "${etapaDoPedido(atual, status).nome}".`,
      { codigo: "STATUS_INVALIDO" },
    );
  }

  const alteracoes = {};
  if (ehEntrega(atual)) {
    if (status === "entrega") {
      alteracoes.entregador = resumoDoEntregador(
        entregadorDisponivel(entregadorId),
      );
      // Pedido feito antes de existir o código ganha o seu ao sair.
      alteracoes.codigoEntrega = atual.codigoEntrega ?? gerarCodigo();
    }
    // Pelo painel a entrega é fechada sem o código do cliente. Fica anotado.
    if (status === "entregue") {
      alteracoes.confirmacao = { tipo: "painel", em: new Date().toISOString() };
    }
    // Pedido reaberto vai sair de novo: outro entregador, outro código.
    if (status === "recebido") {
      alteracoes.entregador = null;
      alteracoes.confirmacao = null;
      alteracoes.codigoEntrega = gerarCodigo();
    }
  }

  const pedido = await Pedido.atualizarStatus(atual.id, status, alteracoes);
  esquecerErros(pedido.id);
  avisarPedido("atualizado", pedido, {
    entregadorAnterior: atual.entregador?.id,
  });
  pararDeRastrearSeLivre(atual.entregador?.id);
  res.json({ pedido: pedidoParaPainel(pedido) });
}

/** Troca quem está levando um pedido que já saiu. */
export async function definirEntregador(req, res) {
  const atual = Pedido.buscarPorId(req.params.id);
  if (!atual) throw pedidoNaoEncontrado();
  if (!ehEntrega(atual) || atual.status !== "entrega") {
    throw new ErroHttp(
      409,
      "Só dá para trocar o entregador de um pedido que saiu para entrega.",
      { codigo: "STATUS_INVALIDO" },
    );
  }

  const entregador = entregadorDisponivel(req.dados.entregadorId);
  const pedido = await Pedido.atualizar(atual.id, {
    entregador: resumoDoEntregador(entregador),
    codigoEntrega: atual.codigoEntrega ?? gerarCodigo(),
  });

  avisarPedido("atualizado", pedido, {
    entregadorAnterior: atual.entregador?.id,
  });
  pararDeRastrearSeLivre(atual.entregador?.id);
  res.json({ pedido: pedidoParaPainel(pedido) });
}
