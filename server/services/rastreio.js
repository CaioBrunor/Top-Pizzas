// Última posição conhecida de cada entregador. Fica só na memória: é um dado
// que muda a cada poucos segundos e perde o valor em minutos, então não
// compensa gravar em disco.
const posicoes = new Map();

// Depois disso sem notícia, a posição não é mais mostrada a ninguém: é melhor
// dizer "sem localização" do que apontar um lugar onde o entregador não está.
const VALIDADE = 3 * 60_000;

export function registrarPosicao(entregadorId, { lat, lng, precisao = null }) {
  const posicao = { lat, lng, precisao, em: new Date().toISOString() };
  posicoes.set(entregadorId, posicao);
  return posicao;
}

export function posicaoDe(entregadorId) {
  const posicao = posicoes.get(entregadorId);
  if (!posicao) return null;
  if (Date.now() - new Date(posicao.em).getTime() > VALIDADE) {
    posicoes.delete(entregadorId);
    return null;
  }
  return posicao;
}

export function esquecerPosicao(entregadorId) {
  posicoes.delete(entregadorId);
}
