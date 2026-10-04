import { Router } from "express";
import {
  atualizarPerfil,
  cadastrar,
  entrar,
  entrarAdmin,
  entrarEntregador,
  eu,
} from "../controllers/authController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import { limiteDeCadastro, limiteDeLogin } from "../middlewares/seguranca.js";
import { validar } from "../middlewares/validar.js";
import {
  cadastroSchema,
  loginAdminSchema,
  loginSchema,
  perfilSchema,
} from "../validators/auth.js";
import { loginEntregadorSchema } from "../validators/entregador.js";

const rotas = Router();

rotas.post("/cadastrar", limiteDeCadastro, validar(cadastroSchema), cadastrar);
rotas.post("/entrar", limiteDeLogin, validar(loginSchema), entrar);
rotas.post("/admin/entrar", limiteDeLogin, validar(loginAdminSchema), entrarAdmin);
rotas.post(
  "/entregador/entrar",
  limiteDeLogin,
  validar(loginEntregadorSchema),
  entrarEntregador,
);

rotas.get("/eu", autenticar, eu);
rotas.put("/eu", autenticar, exigirPapel("cliente"), validar(perfilSchema), atualizarPerfil);

export default rotas;
