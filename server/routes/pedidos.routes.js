import { Router } from "express";
import {
  atualizarStatus,
  criar,
  definirEntregador,
  detalhar,
  listar,
  listarMeus,
} from "../controllers/pedidoController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import { limiteDePedidos } from "../middlewares/seguranca.js";
import { validar } from "../middlewares/validar.js";
import { atribuicaoSchema } from "../validators/entregador.js";
import { pedidoSchema, statusSchema } from "../validators/pedido.js";

const rotas = Router();

rotas.use(autenticar);

rotas.post("/", exigirPapel("cliente"), limiteDePedidos, validar(pedidoSchema), criar);
rotas.get("/", exigirPapel("admin"), listar);
rotas.get("/meus", exigirPapel("cliente"), listarMeus);
// Quem pode ver cada pedido (o dono ou o painel) é conferido no controller.
rotas.get("/:id", detalhar);
rotas.patch("/:id/status", exigirPapel("admin"), validar(statusSchema), atualizarStatus);
rotas.put(
  "/:id/entregador",
  exigirPapel("admin"),
  validar(atribuicaoSchema),
  definirEntregador,
);

export default rotas;
