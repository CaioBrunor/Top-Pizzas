import { ErroHttp } from "../middlewares/erros.js";
import * as Pedido from "../models/Pedido.js";
import { conferirCodigo } from "../services/codigoDeEntrega.js";
import { pararDeRastrearSeLivre } from "../services/entregas.js";
import { esquecerPosicao, registrarPosicao } from "../services/rastreio.js";
import { avisarPedido, avisarPosicao } from "../services/tempoReal.js";
import { pedidoParaEntregador } from "../services/visoes.js";

// O que o entregador faz pelo celular: ver as entregas que estão com ele,
// mandar a posição e fechar a entrega com o código do cliente.

const inicioDeHoje = () => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje.toISOString();
};

export function listar(req, res) {
  const desde = inicioDeHoje();
  const concluidas = Pedido.listar()
    .filter(
      (p) =>
        p.status === "entregue" &&
        p.entregador?.id === req.usuario.id &&
        p.confirmacao?.em >= desde,
    )
    .map((p) => ({
      id: p.id,
      bairro: p.entrega.bairro,
      em: p.confirmacao.em,
    }));

  res.json({
    entregas: Pedido.listarEmEntregaCom(req.usuario.id).map(pedidoParaEntregador),
    concluidas,
  });
}

export function registrarLocalizacao(req, res) {
  const naRua = Pedido.listarEmEntregaCom(req.usuario.id);

  // Sem pedido na rua, o servidor não guarda nem repassa onde ele está.
  if (naRua.length === 0) {
    esquecerPosicao(req.usuario.id);
  } else {
    avisarPosicao(
      req.usuario.id,
      registrarPosicao(req.usuario.id, req.dados),
      naRua,
    );
  }
  res.status(204).end();
}

export async function confirmar(req, res) {
  const pedido = Pedido.buscarPorId(req.params.id);
  const comigo =
    pedido?.status === "entrega" && pedido.entregador?.id === req.usuario.id;

  // Entrega de outro entregador responde igual a entrega que não existe.
  if (!comigo) {
    throw new ErroHttp(404, "Esta entrega não está mais com você.");
  }

  conferirCodigo(pedido, req.dados.codigo);

  const entregue = await Pedido.atualizarStatus(pedido.id, "entregue", {
    confirmacao: { tipo: "codigo", em: new Date().toISOString() },
  });
  avisarPedido("atualizado", entregue);
  pararDeRastrearSeLivre(req.usuario.id);
  res.json({
    concluida: {
      id: entregue.id,
      bairro: entregue.entrega.bairro,
      em: entregue.confirmacao.em,
    },
  });
}
