import { Router } from "express";
import {
  atualizar,
  criar,
  definirDisponibilidade,
  detalhar,
  listar,
  remover,
} from "../controllers/produtoController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import { validar } from "../middlewares/validar.js";
import { disponibilidadeSchema, produtoSchema } from "../validators/produto.js";

const rotas = Router();
const soAdmin = [autenticar, exigirPapel("admin")];

rotas.get("/", listar);
rotas.get("/:id", detalhar);

rotas.post("/", soAdmin, validar(produtoSchema), criar);
rotas.put("/:id", soAdmin, validar(produtoSchema), atualizar);
rotas.patch(
  "/:id/disponibilidade",
  soAdmin,
  validar(disponibilidadeSchema),
  definirDisponibilidade,
);
rotas.delete("/:id", soAdmin, remover);

export default rotas;
