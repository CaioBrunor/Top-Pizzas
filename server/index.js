import { createServer } from "node:http";
import { criarApp } from "./app.js";
import { conectarBanco, desconectarBanco } from "./config/db.js";
import { config } from "./config/env.js";
import { prepararDados } from "./services/dadosIniciais.js";
import { iniciarTempoReal } from "./services/tempoReal.js";

await conectarBanco();
await prepararDados();

const { app, comSite } = criarApp();
const servidor = createServer(app);
iniciarTempoReal(servidor);

servidor.on("error", (erro) => {
  if (erro.code === "EADDRINUSE") {
    console.error(
      `A porta ${config.porta} já está em uso. Feche o outro servidor ou mude PORT no .env.`,
    );
    process.exit(1);
  }
  throw erro;
});

servidor.listen(config.porta, () => {
  const endereco = `http://localhost:${config.porta}`;
  console.log(`API do Top Pizzas em ${endereco}/api`);
  console.log(
    comSite
      ? `Site (build de produção) em ${endereco}`
      : "Sem build em dist/: use o endereço do Vite ou rode `npm run build`.",
  );
});

for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, async () => {
    servidor.close();
    await desconectarBanco().catch(() => {});
    process.exit(0);
  });
}
