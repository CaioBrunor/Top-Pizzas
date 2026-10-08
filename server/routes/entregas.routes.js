import { Router } from "express";
import {
  confirmar,
  listar,
  registrarLocalizacao,
} from "../controllers/entregaController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import { limiteDePosicao } from "../middlewares/seguranca.js";
import { validar } from "../middlewares/validar.js";
import { codigoSchema, posicaoSchema } from "../validators/entregador.js";

const rotas = Router();

rotas.use(autenticar, exigirPapel("entregador"));

rotas.get("/", listar);
rotas.post("/posicao", limiteDePosicao, validar(posicaoSchema), registrarLocalizacao);
rotas.post("/:id/confirmar", validar(codigoSchema), confirmar);

export default rotas;
