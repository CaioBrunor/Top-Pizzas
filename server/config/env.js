import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..", "..");

// Variáveis já definidas no ambiente têm prioridade sobre o arquivo .env.
const arquivoEnv = join(RAIZ, ".env");
if (existsSync(arquivoEnv)) process.loadEnvFile(arquivoEnv);

const env = process.env;

const inteiro = (valor, padrao) => {
  const n = Number.parseInt(valor ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : padrao;
};

const lista = (valor, padrao) =>
  (valor ?? padrao)
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

const pastaDados = resolve(RAIZ, env.DADOS_DIR ?? "server/data");

// Sem JWT_SECRET no ambiente, o servidor cria um segredo aleatório e guarda
// na pasta de dados. Assim nunca existe um segredo padrão no código e as
// sessões continuam valendo depois de um reinício.
function segredoJwt() {
  const doAmbiente = env.JWT_SECRET?.trim();
  if (doAmbiente) {
    if (doAmbiente.length < 32) {
      throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
    }
    return doAmbiente;
  }

  const arquivo = join(pastaDados, ".segredo-jwt");
  if (existsSync(arquivo)) {
    const salvo = readFileSync(arquivo, "utf8").trim();
    if (salvo.length >= 32) return salvo;
  }

  mkdirSync(pastaDados, { recursive: true });
  const novo = randomBytes(48).toString("hex");
  writeFileSync(arquivo, novo, { mode: 0o600 });
  return novo;
}

export const config = {
  raiz: RAIZ,
  producao: env.NODE_ENV === "production",
  porta: inteiro(env.PORT, 3333),
  pastaDados,
  pastaSite: join(RAIZ, "dist"),

  // Sites que podem chamar a API de outro endereço. O próprio servidor e
  // ferramentas sem navegador (curl, testes) não dependem desta lista.
  origensPermitidas: lista(
    env.ORIGENS_PERMITIDAS,
    "http://localhost:5173,http://127.0.0.1:5173",
  ),
  // Quantidade de proxies na frente do servidor (Render, Nginx...). Sem isso
  // o limite de requisições enxergaria o IP do proxy, não o do visitante.
  proxiesConfiaveis: inteiro(env.PROXIES_CONFIAVEIS, 0),
  forcarHttps: env.FORCAR_HTTPS === "true",
  registrarRequisicoes: env.REGISTRAR_REQUISICOES !== "false",

  jwt: {
    segredo: segredoJwt(),
    emissor: "top-pizzas",
    // Quanto tempo a sessão de cada papel dura.
    validade: {
      cliente: env.JWT_VALIDADE_CLIENTE ?? "7d",
      admin: env.JWT_VALIDADE_ADMIN ?? "8h",
      entregador: env.JWT_VALIDADE_ENTREGADOR ?? "12h",
    },
  },

  admin: {
    usuario: (env.ADMIN_USUARIO ?? "admin").trim().toLowerCase(),
    senha: env.ADMIN_SENHA || null,
  },

  dadosDeExemplo: env.DADOS_DE_EXEMPLO !== "false",

  limites: {
    geral: inteiro(env.LIMITE_GERAL, 600),
    login: inteiro(env.LIMITE_LOGIN, 10),
    cadastro: inteiro(env.LIMITE_CADASTRO, 10),
    pedidos: inteiro(env.LIMITE_PEDIDOS, 15),
  },
};
