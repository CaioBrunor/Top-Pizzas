// Uma linha por requisição: método, rota, status e tempo. A query string e o
// corpo ficam de fora para senhas e tokens nunca irem parar no log.
export function registrarRequisicao(req, res, next) {
  const inicio = performance.now();
  res.on("finish", () => {
    const rota = req.originalUrl.split("?")[0];
    const tempo = Math.round(performance.now() - inicio);
    console.log(`${req.method} ${rota} ${res.statusCode} ${tempo}ms`);
  });
  next();
}
