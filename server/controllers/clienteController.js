import { arredondar } from "../../shared/catalogo.js";
import * as Pedido from "../models/Pedido.js";
import * as Usuario from "../models/Usuario.js";

export async function listar(req, res) {
  const [contas, resumos] = await Promise.all([
    Usuario.listarClientes(),
    Pedido.resumoPorCliente(),
  ]);

  const clientes = contas.map((conta) => {
    const resumo = resumos.get(conta.id);

    return {
      ...Usuario.publico(conta),
      pedidos: resumo?.pedidos ?? 0,
      gastoTotal: arredondar(resumo?.gastoTotal ?? 0),
      ultimoPedido: resumo?.ultimoPedido ?? null,
    };
  });

  res.json({ clientes });
}
