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
