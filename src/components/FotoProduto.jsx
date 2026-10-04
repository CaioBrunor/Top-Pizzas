import { useState } from "react";
import { urlDaFoto } from "../lib/format";

export default function FotoProduto({ produto, tamanho = "media" }) {
  // Foto que não carrega (caminho errado ou sem internet e fora do cache)
  // cai no mesmo marcador de produto sem foto.
  const [quebrada, setQuebrada] = useState(null);

  if (!produto.imagem || quebrada === produto.imagem) {
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
      src={urlDaFoto(produto.imagem)}
      alt={produto.nome}
      loading="lazy"
      decoding="async"
      onError={() => setQuebrada(produto.imagem)}
    />
  );
}
