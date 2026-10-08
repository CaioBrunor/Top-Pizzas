import { usuarioDoToken } from "../services/token.js";
import { ErroHttp } from "./erros.js";

export async function autenticar(req, res, next) {
  const [tipo, token] = (req.get("authorization") ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new ErroHttp(401, "Entre na sua conta para continuar.");
  }

  const sessao = await usuarioDoToken(token);
  if (!sessao) {
    throw new ErroHttp(401, "Sua sessão terminou. Entre novamente.", {
      codigo: "SESSAO_EXPIRADA",
    });
  }

  req.usuario = sessao.usuario;
  next();
}

export const exigirPapel =
  (...papeis) =>
  (req, res, next) => {
    if (!papeis.includes(req.usuario?.papel)) {
      throw new ErroHttp(403, "Sua conta não tem permissão para isso.");
    }
    next();
  };
