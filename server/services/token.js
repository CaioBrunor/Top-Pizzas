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

/**
 * Descobre de quem é o token. Devolve null se ele for inválido, vencido, ou
 * se a conta não existir mais, tiver mudado de papel ou sido desativada desde
 * a emissão.
 */
export function usuarioDoToken(token) {
  if (typeof token !== "string" || !token) return null;
  try {
    // O algoritmo é fixado para um token forjado não escolher outro.
    const conteudo = jwt.verify(token, config.jwt.segredo, {
      algorithms: [ALGORITMO],
      issuer: config.jwt.emissor,
    });
    const usuario = Usuario.buscarPorId(conteudo.sub);
    if (!usuario || usuario.papel !== conteudo.papel) return null;
    if (usuario.ativo === false) return null;
    return { usuario: Usuario.publico(usuario), expiraEm: conteudo.exp * 1000 };
  } catch {
    return null;
  }
}
