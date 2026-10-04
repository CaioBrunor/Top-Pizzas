import { arredondar } from "../../shared/catalogo.js";
import * as Pedido from "../models/Pedido.js";
import * as Usuario from "../models/Usuario.js";

/** Contas de clientes com o resumo dos pedidos de cada uma. */
export function listar(req, res) {
  const pedidos = Pedido.listar();

  const clientes = Usuario.listarClientes().map((conta) => {
    const dele = pedidos.filter((p) => p.clienteId === conta.id);
    const validos = dele.filter((p) => p.status !== "cancelado");

    return {
      ...Usuario.publico(conta),
      pedidos: validos.length,
      gastoTotal: arredondar(validos.reduce((soma, p) => soma + p.total, 0)),
      ultimoPedido: dele[0]?.criadoEm ?? null,
    };
  });

  res.json({ clientes });
}
