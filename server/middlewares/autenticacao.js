import { usuarioDoToken } from "../services/token.js";
import { ErroHttp } from "./erros.js";

/** Exige o cabeçalho "Authorization: Bearer <token>" e preenche req.usuario. */
export function autenticar(req, res, next) {
  const [tipo, token] = (req.get("authorization") ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new ErroHttp(401, "Entre na sua conta para continuar.");
  }

  const sessao = usuarioDoToken(token);
  if (!sessao) {
    throw new ErroHttp(401, "Sua sessão terminou. Entre novamente.", {
      codigo: "SESSAO_EXPIRADA",
    });
  }

  req.usuario = sessao.usuario;
  next();
}

/** Deixa passar só quem tem um dos papéis. Vem sempre depois de `autenticar`. */
export const exigirPapel =
  (...papeis) =>
  (req, res, next) => {
    if (!papeis.includes(req.usuario?.papel)) {
      throw new ErroHttp(403, "Sua conta não tem permissão para isso.");
    }
    next();
  };
