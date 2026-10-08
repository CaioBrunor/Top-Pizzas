/**
 * O resto do servidor e o site trabalham com `id` (texto), não com `_id`.
 * Os models guardam o id em `_id` e devolvem objetos simples já com `id`,
 * então nada fora desta pasta precisa saber que existe um MongoDB.
 */
export function paraObjeto(documento, { omitir = [] } = {}) {
  if (!documento) return null;
  const { _id, __v, ...resto } = documento;
  for (const campo of omitir) delete resto[campo];
  return { id: _id, ...resto };
}

/** Erro de índice único do MongoDB (valor duplicado). */
export const ehDuplicado = (erro) => erro?.code === 11000;

export function semIndefinidos(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  );
}
