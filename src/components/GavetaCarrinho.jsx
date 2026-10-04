import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrinho } from "../context/CarrinhoContext";
import { useLoja } from "../context/LojaContext";
import { PEDIDO_MINIMO } from "../data/catalogo";
import { moeda } from "../lib/format";
import FotoProduto from "./FotoProduto";
import {
  IconeFechar,
  IconeLixeira,
  IconeMais,
  IconeMenos,
  IconeSacola,
} from "./Icones";

export default function GavetaCarrinho() {
  const {
    itens,
    aberto,
    fechar,
    subtotal,
    taxaEntrega,
    total,
    vazio,
    alterarQuantidade,
    remover,
    modoEntrega,
    setModoEntrega,
  } = useCarrinho();
  const { produtos } = useLoja();
  const navegar = useNavigate();

  useEffect(() => {
    const aoTeclar = (e) => e.key === "Escape" && fechar();
    if (aberto) {
      document.addEventListener("keydown", aoTeclar);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto, fechar]);

  const abaixoDoMinimo = subtotal < PEDIDO_MINIMO && !vazio;

  const irParaCheckout = () => {
    fechar();
    navegar("/checkout");
  };

  return (
    <>
      <div
        className={`gaveta__fundo ${aberto ? "gaveta__fundo--visivel" : ""}`}
        onClick={fechar}
        aria-hidden="true"
      />
      <aside
        className={`gaveta ${aberto ? "gaveta--aberta" : ""}`}
        aria-label="Carrinho de compras"
        aria-hidden={!aberto}
      >
        <header className="gaveta__cabecalho">
          <h2 className="gaveta__titulo">Seu pedido</h2>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar carrinho"
            className="gaveta__fechar"
          >
            <IconeFechar />
          </button>
        </header>

        {vazio ? (
          <div className="gaveta__vazio">
            <IconeSacola width={34} height={34} />
            <p>O carrinho ainda está vazio.</p>
            <button
              type="button"
              className="btn btn--linha"
              onClick={() => {
                fechar();
                navegar("/cardapio");
              }}
            >
              Ver o cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="gaveta__lista">
              {itens.map((item) => (
                <article key={item.linhaId} className="linha">
                  <div className="linha__arte">
                    {}
                    <FotoProduto
                      produto={{
                        id: item.produtoId,
                        nome: item.nome,
                        tipo: item.tipo,
                        imagem:
                          produtos.find((p) => p.id === item.produtoId)
                            ?.imagem ??
                          item.imagem ??
                          null,
                      }}
                      tamanho="mini"
                    />
                  </div>

                  <div className="linha__info">
                    <p className="linha__nome">{item.nome}</p>
                    <p className="linha__detalhe">
                      {item.tamanhoNome}
                      {item.bordaNome && item.borda !== "sem"
                        ? ` · ${item.bordaNome}`
                        : ""}
                    </p>
                    {item.observacao && (
                      <p className="linha__obs">{item.observacao}</p>
                    )}

                    <div className="linha__controles">
                      <div className="contador contador--pequeno">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.linhaId, -1)}
                          aria-label={`Diminuir ${item.nome}`}
                        >
                          <IconeMenos width={14} height={14} />
                        </button>
                        <span>{item.quantidade}</span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.linhaId, 1)}
                          aria-label={`Aumentar ${item.nome}`}
                        >
                          <IconeMais width={14} height={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="linha__remover"
                        onClick={() => remover(item.linhaId)}
                        aria-label={`Remover ${item.nome}`}
                      >
                        <IconeLixeira width={16} height={16} />
                      </button>
                    </div>
                  </div>

                  <p className="linha__preco">
                    {moeda(item.precoUnitario * item.quantidade)}
                  </p>
                </article>
              ))}
            </div>

            <footer className="gaveta__resumo">
              <div
                className="alternador"
                role="group"
                aria-label="Forma de recebimento"
              >
                <button
                  type="button"
                  className={
                    modoEntrega === "entrega" ? "alternador--ativo" : ""
                  }
                  onClick={() => setModoEntrega("entrega")}
                >
                  Entrega
                </button>
                <button
                  type="button"
                  className={
                    modoEntrega === "retirada" ? "alternador--ativo" : ""
                  }
                  onClick={() => setModoEntrega("retirada")}
                >
                  Retirar na loja
                </button>
              </div>

              <dl className="resumo">
                <div className="resumo__linha">
                  <dt>Subtotal</dt>
                  <dd>{moeda(subtotal)}</dd>
                </div>
                <div className="resumo__linha">
                  <dt>{modoEntrega === "retirada" ? "Retirada" : "Entrega"}</dt>
                  <dd>{taxaEntrega === 0 ? "Grátis" : moeda(taxaEntrega)}</dd>
                </div>
                <div className="resumo__linha resumo__linha--total">
                  <dt>Total</dt>
                  <dd>{moeda(total)}</dd>
                </div>
              </dl>

              {abaixoDoMinimo && (
                <p className="gaveta__aviso">
                  Faltam {moeda(PEDIDO_MINIMO - subtotal)} para atingir o pedido
                  mínimo de {moeda(PEDIDO_MINIMO)}.
                </p>
              )}

              <button
                type="button"
                className="btn btn--ambar btn--bloco"
                onClick={irParaCheckout}
                disabled={abaixoDoMinimo}
              >
                Fechar pedido
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
