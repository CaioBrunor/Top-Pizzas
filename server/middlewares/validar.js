import { ErroHttp } from "./erros.js";

const valorEm = (dados, caminho) =>
  caminho.reduce((atual, chave) => atual?.[chave], dados);

// { "entrega.cep": "O CEP tem 8 dígitos." }: a primeira mensagem de cada campo.
function camposComErro(erro, dados) {
  const campos = {};
  for (const problema of erro.issues) {
    const campo = problema.path.join(".") || "geral";
    if (campo in campos) continue;

    const faltou =
      problema.code === "invalid_type" &&
      valorEm(dados, problema.path) === undefined;
    campos[campo] = faltou ? "Campo obrigatório." : problema.message;
  }
  return campos;
}

/**
 * Confere o corpo da requisição contra um schema do zod. Os controllers leem
 * `req.dados`, que só tem os campos previstos no schema, já limpos. Qualquer
 * campo a mais enviado pelo cliente é descartado.
 */
export const validar = (schema) => (req, res, next) => {
  const corpo = req.body ?? {};
  const resultado = schema.safeParse(corpo);

  if (!resultado.success) {
    throw new ErroHttp(422, "Confira os campos destacados.", {
      campos: camposComErro(resultado.error, corpo),
    });
  }

  req.dados = resultado.data;
  next();
};
