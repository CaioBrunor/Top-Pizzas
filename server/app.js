import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import express from "express";
import { config } from "./config/env.js";
import { naoEncontrado, tratarErros } from "./middlewares/erros.js";
import { registrarRequisicao } from "./middlewares/registro.js";
import {
  cabecalhosDeSeguranca,
  limiteGeral,
  permitirOrigens,
  semCache,
} from "./middlewares/seguranca.js";
import rotas from "./routes/index.js";

const UM_ANO = 365 * 24 * 60 * 60;

// Arquivos com hash no nome (index-Ab12Cd34.js) nunca mudam de conteúdo, então
// podem ficar em cache para sempre. O resto é conferido a cada visita, para o
// site e o service worker se atualizarem.
function cacheDoArquivo(res, caminho) {
  const comHash = /-[\w-]{8,}\.(js|css)$/.test(caminho);
  res.set(
    "Cache-Control",
    comHash ? `public, max-age=${UM_ANO}, immutable` : "no-cache",
  );
}

// Depois do `npm run build`, o mesmo servidor entrega o site: tudo em um
// endereço só, que é o que o PWA precisa para funcionar offline.
function servirSite(app) {
  const pagina = join(config.pastaSite, "index.html");
  if (!existsSync(pagina)) return false;

  app.use(express.static(config.pastaSite, { index: false, setHeaders: cacheDoArquivo }));

  // As rotas do site (/cardapio, /admin/painel...) são resolvidas no navegador
  // pelo React Router, então todas recebem a mesma página.
  app.use((req, res, next) => {
    const ehPagina =
      (req.method === "GET" || req.method === "HEAD") &&
      !extname(req.path) &&
      req.accepts("html");
    if (!ehPagina) return next();

    res.set("Cache-Control", "no-cache");
    res.sendFile(pagina);
  });
  return true;
}

export function criarApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.proxiesConfiaveis);

  app.use(cabecalhosDeSeguranca);

  // A ordem importa: quem passa do limite ou vem de uma origem não permitida
  // é barrado antes de o corpo ser lido.
  const api = express.Router();
  api.use(permitirOrigens, limiteGeral, semCache);
  if (config.registrarRequisicoes) api.use(registrarRequisicao);
  api.use(express.json({ limit: "100kb" }));
  api.use(rotas);
  api.use(naoEncontrado);
  app.use("/api", api);

  const comSite = servirSite(app);

  app.use(naoEncontrado);
  app.use(tratarErros);

  return { app, comSite };
}
