export default function Campo({
  rotulo,
  valor,
  erro,
  aoMudar,
  largo = false,
  ...resto
}) {
  return (
    <label className={`campo ${largo ? "campo--largo" : ""}`}>
      <span className="campo__rotulo">{rotulo}</span>
      <input
        className="campo__entrada"
        value={valor}
        aria-invalid={erro ? "true" : undefined}
        onChange={(e) => aoMudar(e.target.value)}
        {...resto}
      />
      {erro && <span className="campo__erro">{erro}</span>}
    </label>
  );
}
