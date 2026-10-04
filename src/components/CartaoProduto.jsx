import FotoProduto from "./FotoProduto";
import { moeda } from "../lib/format";

export default function CartaoProduto({ produto, aoEscolher }) {
  const ehBebida = produto.tipo === "bebida";
  const menorPreco = ehBebida
    ? produto.precos.unico
    : Math.min(...Object.values(produto.precos));

  return (
    <article
      className={`cartao ${produto.disponivel ? "" : "cartao--esgotado"}`}
    >
      <div className="cartao__arte">
        <FotoProduto produto={produto} />
        {!produto.disponivel && (
          <span className="cartao__faixa">Fora do cardápio hoje</span>
        )}
      </div>

      <div className="cartao__corpo">
        <div className="cartao__topo">
          <h3 className="cartao__nome">{produto.nome}</h3>
          {produto.tags.length > 0 && (
            <ul className="cartao__tags">
              {produto.tags.map((t) => (
                <li key={t} className="selo selo--ambar">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="cartao__descricao">{produto.descricao}</p>

        <div className="cartao__rodape">
          <p className="cartao__preco">
            <span className="cartao__preco-rotulo">
              {ehBebida ? "unidade" : "a partir de"}
            </span>
            {moeda(menorPreco)}
          </p>
          <button
            type="button"
            className="btn btn--ambar btn--pequeno"
            onClick={() => aoEscolher(produto)}
            disabled={!produto.disponivel}
          >
            {ehBebida ? "Adicionar" : "Montar"}
          </button>
        </div>
      </div>
    </article>
  );
}
