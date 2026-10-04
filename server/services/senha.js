import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt);

// Custo recomendado pela OWASP para scrypt. Fica gravado junto do hash, então
// dá para aumentar no futuro sem invalidar as senhas antigas.
const CUSTO = { N: 2 ** 15, r: 8, p: 3 };
const TAMANHO_CHAVE = 64;
const MEMORIA_MAXIMA = 128 * 1024 * 1024;

export async function gerarHash(senha) {
  const sal = randomBytes(16);
  const chave = await derivar(senha, sal, TAMANHO_CHAVE, {
    ...CUSTO,
    maxmem: MEMORIA_MAXIMA,
  });
  const { N, r, p } = CUSTO;
  return ["scrypt", N, r, p, sal.toString("base64"), chave.toString("base64")].join("$");
}

async function confere(senha, hash) {
  const [algoritmo, N, r, p, sal, chave] = hash.split("$");
  if (algoritmo !== "scrypt" || !sal || !chave) return false;

  const esperada = Buffer.from(chave, "base64");
  const calculada = await derivar(senha, Buffer.from(sal, "base64"), esperada.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: MEMORIA_MAXIMA,
  });
  return timingSafeEqual(esperada, calculada);
}

let hashFalso = null;

/**
 * Confere a senha contra o hash salvo. Quando a conta não existe (hash nulo),
 * faz a mesma conta contra um hash qualquer, para o tempo de resposta não
 * revelar quais e-mails estão cadastrados.
 */
export async function conferirSenha(senha, hash) {
  if (!hash) {
    hashFalso ??= gerarHash(randomBytes(16).toString("hex"));
    await confere(senha, await hashFalso);
    return false;
  }
  return confere(senha, hash);
}
