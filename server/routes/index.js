import { Router } from "express";
import { restaurar } from "../controllers/adminController.js";
import { listar as listarClientes } from "../controllers/clienteController.js";
import { autenticar, exigirPapel } from "../middlewares/autenticacao.js";
import authRoutes from "./auth.routes.js";
import entregadoresRoutes from "./entregadores.routes.js";
import entregasRoutes from "./entregas.routes.js";
import pedidosRoutes from "./pedidos.routes.js";
import produtosRoutes from "./produtos.routes.js";

const rotas = Router();
const soAdmin = [autenticar, exigirPapel("admin")];

rotas.get("/saude", (req, res) => {
  res.json({ ok: true, hora: new Date().toISOString() });
});

rotas.use("/auth", authRoutes);
rotas.use("/produtos", produtosRoutes);
rotas.use("/pedidos", pedidosRoutes);
rotas.use("/entregadores", entregadoresRoutes);
rotas.use("/entregas", entregasRoutes);

rotas.get("/clientes", soAdmin, listarClientes);
rotas.post("/admin/restaurar", soAdmin, restaurar);

export default rotas;
