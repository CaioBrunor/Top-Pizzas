import { randomInt, timingSafeEqual } from "node:crypto";
import { DIGITOS_DO_CODIGO } from "../../shared/pedidos.js";
import { ErroHttp } from "../middlewares/erros.js";

// Com 4 dígitos existem 10 mil códigos. O limite de erros impede o entregador
// de ir testando um por um para fechar uma entrega que não fez.
const ERROS_PERMITIDOS = 5;
const BLOQUEIO = 10 * 60_000;

const erros = new Map();

export function gerarCodigo() {
  return String(randomInt(0, 10 ** DIGITOS_DO_CODIGO)).padStart(
    DIGITOS_DO_CODIGO,
    "0",
  );
}

/** Confere o código informado pelo cliente. Lança erro se não bater. */
export function conferirCodigo(pedido, codigo) {
  const registro = erros.get(pedido.id);
  if (registro?.bloqueadoAte > Date.now()) {
    throw new ErroHttp(
      429,
      "Muitos códigos errados para esta entrega. Espere 10 minutos ou fale com a loja.",
      { codigo: "CODIGO_BLOQUEADO" },
    );
  }

  const esperado = Buffer.from(String(pedido.codigoEntrega ?? ""));
  const informado = Buffer.from(String(codigo));
  const confere =
    esperado.length > 0 &&
    esperado.length === informado.length &&
    timingSafeEqual(esperado, informado);

  if (confere) {
    erros.delete(pedido.id);
    return;
  }

  // Um bloqueio que já venceu zera a contagem.
  const total = (registro?.bloqueadoAte ? 0 : (registro?.total ?? 0)) + 1;
  const restam = ERROS_PERMITIDOS - total;
  erros.set(
    pedido.id,
    restam > 0 ? { total } : { total, bloqueadoAte: Date.now() + BLOQUEIO },
  );

  throw new ErroHttp(422, "O código não confere.", {
    codigo: "CODIGO_INCORRETO",
    campos: {
      codigo:
        restam > 0
          ? `Código incorreto. ${restam === 1 ? "Resta 1 tentativa" : `Restam ${restam} tentativas`}.`
          : "Código incorreto. Esta entrega ficou bloqueada por 10 minutos.",
    },
  });
}

export function esquecerErros(pedidoId) {
  erros.delete(pedidoId);
}
