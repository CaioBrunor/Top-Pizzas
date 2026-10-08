import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import * as Usuario from "../models/Usuario.js";

const ALGORITMO = "HS256";

export function emitirToken(usuario) {
  const { segredo, emissor, validade } = config.jwt;
  return jwt.sign({ papel: usuario.papel }, segredo, {
    algorithm: ALGORITMO,
    issuer: emissor,
    subject: usuario.id,
    expiresIn: validade[usuario.papel],
  });
}

export async function usuarioDoToken(token) {
  if (typeof token !== "string" || !token) return null;

  let conteudo;
  try {
    // O algoritmo é fixado para um token forjado não escolher outro.
    conteudo = jwt.verify(token, config.jwt.segredo, {
      algorithms: [ALGORITMO],
      issuer: config.jwt.emissor,
    });
  } catch {
    return null;
  }

  // Fora do try de propósito: se o banco falhar, o erro aparece como erro do
  // servidor, e não como "sua sessão terminou".
  const usuario = await Usuario.buscarPorId(conteudo.sub);
  if (!usuario || usuario.papel !== conteudo.papel) return null;
  if (usuario.ativo === false) return null;
  return { usuario: Usuario.publico(usuario), expiraEm: conteudo.exp * 1000 };
}
