import mongoose from "mongoose";
import { config } from "./env.js";

// Com o banco fora do ar, o Mongoose seguraria cada consulta por 10 segundos
// antes de falhar. Sem buffer, o erro aparece na hora.
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

function enderecoSemSenha(uri) {
  return uri.replace(/\/\/[^@/]*@/, "//***@");
}

export async function conectarBanco() {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
  } catch (erro) {
    console.error(
      `Não foi possível conectar ao MongoDB (${enderecoSemSenha(config.mongodbUri)}).\n` +
        `Motivo: ${erro.message}\n` +
        "Confira se o MongoDB está rodando e se MONGODB_URI no .env está certo.",
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () =>
    console.warn("[mongodb] conexão perdida, tentando reconectar..."),
  );
  mongoose.connection.on("reconnected", () =>
    console.log("[mongodb] reconectado"),
  );

  // Cria os índices (e-mail único, por exemplo) antes de aceitar requisições.
  try {
    await Promise.all(
      Object.values(mongoose.models).map((modelo) => modelo.init()),
    );
  } catch (erro) {
    console.error(
      `Não foi possível criar os índices do MongoDB: ${erro.message}\n` +
        "Se já existem dados repetidos (e-mail ou telefone), corrija-os e reinicie.",
    );
    process.exit(1);
  }

  const { host, name } = mongoose.connection;
  console.log(`[mongodb] conectado em ${host}/${name}`);
}

export async function desconectarBanco() {
  await mongoose.disconnect();
}
