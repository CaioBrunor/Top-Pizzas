import * as Pedido from "../models/Pedido.js";
import { esquecerPosicao } from "./rastreio.js";
import { avisarAdmins } from "./tempoReal.js";

export async function pararDeRastrearSeLivre(entregadorId) {
  if (!entregadorId) return;
  if ((await Pedido.listarEmEntregaCom(entregadorId)).length > 0) return;

  esquecerPosicao(entregadorId);
  avisarAdmins("entregador:posicao", { entregadorId, posicao: null });
}
