import { Router } from "express";
import {
  atualizar,
  criar,
  definirAtivo,
  listar,
  remover,
} from "../controllers/entregadorController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import { validar } from "../middlewares/validar.js";
import {
  ativoSchema,
  entregadorSchema,
  novoEntregadorSchema,
} from "../validators/entregador.js";

const rotas = Router();

rotas.use(autenticar, exigirPapel("admin"));

rotas.get("/", listar);
rotas.post("/", validar(novoEntregadorSchema), criar);
rotas.put("/:id", validar(entregadorSchema), atualizar);
rotas.patch("/:id/ativo", validar(ativoSchema), definirAtivo);
rotas.delete("/:id", remover);

export default rotas;
