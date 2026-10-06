import mongoose from "mongoose";

// Coleção pequena de controle: o contador dos códigos de pedido e a marca de
// que os dados iniciais já foram gravados (para um cardápio ou uma lista de
// pedidos vazios, de propósito, não serem preenchidos de novo a cada reinício).
const metaSchema = new mongoose.Schema(
  {
    _id: String,
    seq: Number,
    semeado: Boolean,
  },
  { collection: "meta", versionKey: false },
);

const Meta = mongoose.model("Meta", metaSchema);

export async function foiSemeado(chave) {
  const marca = await Meta.findById(`semeado:${chave}`).lean();
  return marca?.semeado === true;
}

export async function marcarSemeado(chave) {
  await Meta.updateOne(
    { _id: `semeado:${chave}` },
    { $set: { semeado: true } },
    { upsert: true },
  );
}

/** Próximo número da sequência, sem repetir mesmo com pedidos simultâneos. */
export async function proximoNumero(chave) {
  const { seq } = await Meta.findOneAndUpdate(
    { _id: `sequencia:${chave}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  return seq;
}

/** Garante que a sequência nunca fique abaixo de `minimo`. */
export async function garantirSequenciaMinima(chave, minimo) {
  await Meta.updateOne(
    { _id: `sequencia:${chave}` },
    { $max: { seq: minimo } },
    { upsert: true },
  );
}
