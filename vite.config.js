import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Os arquivos principais do site, que o service worker guarda na instalação
// para o app abrir sem internet. As fotos do cardápio ficam de fora: são
// guardadas aos poucos, conforme o uso.
const ehPrincipal = (arquivo) =>
  arquivo !== "sw.js" &&
  !arquivo.startsWith("assets/pizzas/") &&
  !arquivo.endsWith(".map");

function listarArquivos(pasta, raiz = pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    return item.isDirectory()
      ? listarArquivos(caminho, raiz)
      : [relative(raiz, caminho).split(sep).join("/")];
  });
}

// Depois do build, escreve no topo do dist/sw.js a lista dos arquivos
// gerados (os nomes mudam a cada build) e uma versão calculada a partir do
// conteúdo deles. Arquivo mudou, versão mudou, o navegador atualiza o cache.
function prepararServiceWorker() {
  let pastaDoBuild;

  return {
    name: "top-pizzas:service-worker",
    apply: "build",
    configResolved(config) {
      pastaDoBuild = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const arquivos = listarArquivos(pastaDoBuild).filter(ehPrincipal).sort();
      const origem = readFileSync(join(pastaDoBuild, "sw.js"), "utf8");

      const hash = createHash("sha256").update(origem);
      for (const arquivo of arquivos) {
        hash.update(arquivo).update(readFileSync(join(pastaDoBuild, arquivo)));
      }

      const dados = {
        versao: hash.digest("hex").slice(0, 10),
        arquivos: arquivos.map((arquivo) => `/${arquivo}`),
      };
      writeFileSync(
        join(pastaDoBuild, "sw.js"),
        `self.__PWA__ = ${JSON.stringify(dados)};\n${origem}`,
      );
      console.log(
        `service worker: versão ${dados.versao}, ${arquivos.length} arquivos principais`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // A API roda em outro processo (npm run dev sobe os dois). O Vite repassa
  // as chamadas para ela, então o navegador enxerga um endereço só.
  const env = loadEnv(mode, process.cwd(), "");
  const api = `http://localhost:${env.PORT || 3333}`;
  const proxy = {
    "/api": api,
    "/socket.io": { target: api, ws: true },
  };

  return {
    plugins: [react(), prepararServiceWorker()],
    server: { port: 5173, open: true, proxy },
    preview: { proxy },
  };
});
