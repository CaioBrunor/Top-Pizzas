import { VERSAO_CATALOGO } from "../data/catalogo";

// As etapas do pedido são as mesmas no site e no servidor.
export {
  DIGITOS_DO_CODIGO,
  FLUXO_STATUS,
  STATUS_PEDIDO,
  ehEntrega,
  etapaDoPedido,
  pedidoEmAberto,
  proximoStatus,
  statusInfo,
} from "../../shared/pedidos.js";

export const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(valor) ? valor : 0,
  );

export const dataHora = (iso) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const dataCurta = (iso) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
    new Date(iso),
  );

export const hora = (iso) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );

// "agora", "há 40 s", "há 3 min": usado para dizer de quando é a posição.
export function haQuantoTempo(iso, agora = Date.now()) {
  const segundos = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 1000));
  if (segundos < 10) return "agora";
  if (segundos < 60) return `há ${segundos} s`;
  return `há ${Math.round(segundos / 60)} min`;
}

export const primeiroNome = (nome) => String(nome ?? "").trim().split(/\s+/)[0];

export const urlDaFoto = (imagem) => `${imagem}?v=${VERSAO_CATALOGO}`;

export const mascaraTelefone = (valor) => {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].join(""),
    );
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
    c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`,
  );
};

export const mascaraCep = (valor) => {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const mascaraCartao = (valor) =>
  valor
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

export const mascaraValidade = (valor) => {
  const d = valor.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export const soDigitos = (valor) => valor.replace(/\D/g, "");

export const mascaraPreco = (valor) => {
  let v = String(valor)
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, ",");
  const partes = v.split(",");
  if (partes.length > 2) v = `${partes[0]},${partes.slice(1).join("")}`;
  const [inteiro, centavos] = v.split(",");
  const i = inteiro.replace(/^0+(?=\d)/, "").slice(0, 6);
  return centavos === undefined ? i : `${i},${centavos.slice(0, 2)}`;
};

export const precoParaNumero = (valor) => {
  const n = parseFloat(String(valor).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

export const numeroParaPreco = (n) =>
  Number.isFinite(n) && n > 0 ? n.toFixed(2).replace(".", ",") : "";
