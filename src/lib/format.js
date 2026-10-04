export const STATUS_PEDIDO = [
  { id: "recebido", nome: "Recebido", cor: "selo--ambar" },
  { id: "preparo", nome: "Em preparo", cor: "selo--ambar" },
  { id: "forno", nome: "No forno", cor: "selo--quente" },
  { id: "entrega", nome: "Saiu para entrega", cor: "selo--quente" },
  { id: "entregue", nome: "Entregue", cor: "selo--basil" },
  { id: "cancelado", nome: "Cancelado", cor: "selo--danger" },
];

export const FLUXO_STATUS = [
  "recebido",
  "preparo",
  "forno",
  "entrega",
  "entregue",
];

export function statusInfo(id) {
  return STATUS_PEDIDO.find((s) => s.id === id) ?? STATUS_PEDIDO[0];
}

export function proximoStatus(id) {
  const i = FLUXO_STATUS.indexOf(id);
  if (i === -1 || i === FLUXO_STATUS.length - 1) return null;
  return FLUXO_STATUS[i + 1];
}

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

export function gerarCodigoPedido() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TP-${n}`;
}

export function semente(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
