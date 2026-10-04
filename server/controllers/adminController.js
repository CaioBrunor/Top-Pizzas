import { restaurarDadosDeExemplo } from "../services/dadosIniciais.js";
import { avisarTodos } from "../services/tempoReal.js";

export async function restaurar(req, res) {
  await restaurarDadosDeExemplo();

  // Cada tela aberta recarrega o que tem permissão para ver.
  avisarTodos("dados:restaurados", {});
  res.status(204).end();
}
