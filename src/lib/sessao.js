import { aoMudarEmOutraAba, gravar, ler, limpar } from "./persistencia";

// O navegador guarda uma sessão separada para cada área no localStorage: a
// do cliente, a do painel e a do entregador. Assim dá para acompanhar um
// pedido e operar o painel no mesmo navegador, cada lado com o próprio token.
const CHAVES = {
  cliente: "sessao:cliente",
  admin: "sessao:admin",
  entregador: "sessao:entregador",
};

const salva = (escopo) => {
  const sessao = ler(CHAVES[escopo], null);
  return sessao?.token && sessao?.usuario ? sessao : null;
};

const sessoes = {
  cliente: salva("cliente"),
  admin: salva("admin"),
  entregador: salva("entregador"),
};
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((fn) => fn());

export const lerSessao = (escopo) => sessoes[escopo];

export function gravarSessao(escopo, sessao) {
  sessoes[escopo] = sessao;
  gravar(CHAVES[escopo], sessao);
  avisar();
}

export function limparSessao(escopo) {
  if (!sessoes[escopo]) return;
  sessoes[escopo] = null;
  limpar(CHAVES[escopo]);
  avisar();
}

export function aoMudarSessao(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

// Entrar ou sair em uma aba vale para todas as outras.
for (const escopo of Object.keys(CHAVES)) {
  aoMudarEmOutraAba(CHAVES[escopo], () => {
    sessoes[escopo] = salva(escopo);
    avisar();
  });
}
