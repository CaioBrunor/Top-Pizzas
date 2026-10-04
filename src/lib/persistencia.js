const PREFIXO = "top-pizzas:";

export function ler(chave, padrao) {
  try {
    const bruto = window.localStorage.getItem(PREFIXO + chave);
    if (!bruto) return padrao;
    return JSON.parse(bruto);
  } catch {
    return padrao;
  }
}

export function gravar(chave, valor) {
  try {
    window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {}
}

export function limpar(chave) {
  try {
    window.localStorage.removeItem(PREFIXO + chave);
  } catch {}
}

// O evento "storage" só dispara nas outras abas, nunca na que fez a mudança.
export function aoMudarEmOutraAba(chave, fn) {
  const ouvir = (evento) => {
    if (evento.key === null || evento.key === PREFIXO + chave) fn();
  };
  window.addEventListener("storage", ouvir);
  return () => window.removeEventListener("storage", ouvir);
}
