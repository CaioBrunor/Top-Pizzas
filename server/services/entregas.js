import * as Pedido from "../models/Pedido.js";
import { esquecerPosicao } from "./rastreio.js";
import { avisarAdmins } from "./tempoReal.js";

/**
 * O entregador só é rastreado enquanto leva algum pedido. Quando a última
 * entrega dele termina (ou troca de mãos), a posição é esquecida e o painel
 * é avisado.
 */
export async function pararDeRastrearSeLivre(entregadorId) {
  if (!entregadorId) return;
  if ((await Pedido.listarEmEntregaCom(entregadorId)).length > 0) return;

  esquecerPosicao(entregadorId);
  avisarAdmins("entregador:posicao", { entregadorId, posicao: null });
}
