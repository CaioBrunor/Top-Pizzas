import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { config } from "../config/env.js";
import { ErroHttp } from "./erros.js";

const FONTES_GOOGLE = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

/**
 * Cabeçalhos de segurança. A política de conteúdo (CSP) só deixa o navegador
 * carregar scripts do próprio site, o que barra a maior parte dos ataques de
 * XSS mesmo se algum texto malicioso chegar à página.
 */
export const cabecalhosDeSeguranca = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      // Animações (GSAP) e o React aplicam estilos direto nos elementos.
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // O admin pode cadastrar a foto de um produto por URL.
      imgSrc: ["'self'", "data:", "https:"],
      // ws/wss: pedidos em tempo real. Fontes: o service worker guarda uma
      // cópia delas para o modo offline.
      connectSrc: ["'self'", "ws:", "wss:", ...FONTES_GOOGLE],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(config.forcarHttps && { upgradeInsecureRequests: [] }),
    },
  },
  strictTransportSecurity: config.forcarHttps,
  crossOriginEmbedderPolicy: false,
});

/** O endereço que fez a requisição pode falar com a API? */
export function origemPermitida(origem, hospedeiro) {
  if (!origem) return true;
  if (config.origensPermitidas.includes(origem)) return true;
  try {
    return new URL(origem).host === hospedeiro;
  } catch {
    return false;
  }
}

// Origens fora da lista não recebem os cabeçalhos de CORS, então o navegador
// delas bloqueia a leitura da resposta.
export const permitirOrigens = cors((req, responder) => {
  responder(null, {
    origin: origemPermitida(req.get("origin"), req.get("host")),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  });
});

// Respostas da API nunca ficam guardadas em cache do navegador ou de proxies.
export function semCache(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

const limitar = ({ janelaMinutos, limite, mensagem, ...resto }) =>
  rateLimit({
    windowMs: janelaMinutos * 60_000,
    limit: limite,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next) => next(new ErroHttp(429, mensagem)),
    ...resto,
  });

// A posição do entregador chega a cada poucos segundos e tem limite próprio
// (logo abaixo), para não gastar a cota das outras chamadas.
const ehPosicao = (req) =>
  req.method === "POST" && req.path === "/entregas/posicao";

export const limiteGeral = limitar({
  janelaMinutos: 15,
  limite: config.limites.geral,
  skip: ehPosicao,
  mensagem: "Muitas requisições seguidas. Espere um pouco e tente de novo.",
});

// Contado por entregador, e não por IP: vários podem usar a mesma rede.
export const limiteDePosicao = limitar({
  janelaMinutos: 1,
  limite: 40,
  keyGenerator: (req) => req.usuario.id,
  mensagem: "Posição enviada vezes demais. Espere um pouco.",
});

// Só as tentativas que falham contam: é a proteção contra adivinhar senhas.
export const limiteDeLogin = limitar({
  janelaMinutos: 15,
  limite: config.limites.login,
  skipSuccessfulRequests: true,
  mensagem: "Muitas tentativas de entrar. Espere 15 minutos e tente de novo.",
});

export const limiteDeCadastro = limitar({
  janelaMinutos: 60,
  limite: config.limites.cadastro,
  mensagem: "Muitos cadastros vindos desta rede. Tente de novo mais tarde.",
});

export const limiteDePedidos = limitar({
  janelaMinutos: 10,
  limite: config.limites.pedidos,
  mensagem: "Muitos pedidos em sequência. Espere alguns minutos.",
});
