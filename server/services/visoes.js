import { pedidoEmAberto } from "../../shared/pedidos.js";
import * as Usuario from "../models/Usuario.js";
import { posicaoDe } from "./rastreio.js";

// O mesmo pedido sai do servidor de três jeitos, conforme quem pede. O código
// de entrega só existe na visão do cliente: nem o painel nem o entregador
// recebem, senão ele não provaria que a entrega chegou à pessoa certa.

export function pedidoParaCliente(pedido) {
  const naRua = pedido.status === "entrega" && pedido.entregador;
  return {
    ...pedido,
    codigoEntrega: pedidoEmAberto(pedido.status)
      ? (pedido.codigoEntrega ?? null)
      : null,
    rastreio: naRua ? posicaoDe(pedido.entregador.id) : null,
  };
}

export function pedidoParaPainel(pedido) {
  const { codigoEntrega, ...resto } = pedido;
  return resto;
}

// O entregador recebe o necessário para chegar e cobrar. O e-mail do cliente
// e o código ficam de fora.
export function pedidoParaEntregador(pedido) {
  return {
    id: pedido.id,
    criadoEm: pedido.criadoEm,
    atualizadoEm: pedido.atualizadoEm,
    status: pedido.status,
    cliente: { nome: pedido.cliente.nome, telefone: pedido.cliente.telefone },
    entrega: pedido.entrega,
    pagamento: pedido.pagamento,
    itens: pedido.itens,
    total: pedido.total,
  };
}

export function resumoDoEntregador(entregador) {
  return {
    id: entregador.id,
    nome: entregador.nome,
    veiculo: entregador.veiculo,
    placa: entregador.placa,
  };
}

export function entregadorParaPainel(entregador) {
  return { ...Usuario.publico(entregador), posicao: posicaoDe(entregador.id) };
}
