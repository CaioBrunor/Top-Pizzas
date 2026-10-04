import { VERSAO_CATALOGO } from "../data/catalogo";
export default function FotoProduto({ produto, tamanho = "media" }) {
  if (!produto.imagem) {
    return (
      <div className={`foto-vazia foto-vazia--${tamanho}`} role="presentation">
        <span className="foto-vazia__inicial">{produto.nome.charAt(0)}</span>
        <span className="foto-vazia__texto">foto pendente</span>
      </div>
    );
  }

  return (
    <img
      className={`foto foto--${tamanho}`}
      src={`${produto.imagem}?v=${VERSAO_CATALOGO}`}
      alt={produto.nome}
      loading="lazy"
      decoding="async"
    />
  );
}
