import { useEffect, useRef, useState } from "react";
import FotoProduto from "./FotoProduto";
import { BORDAS, TAMANHOS } from "../data/catalogo";
import { moeda } from "../lib/format";
import { useCarrinho } from "../context/CarrinhoContext";
import { IconeFechar, IconeMais, IconeMenos } from "./Icones";

export default function ModalProduto({ produto, aoFechar }) {
  const { adicionar } = useCarrinho();
  const ehBebida = produto.tipo === "bebida";

  const [tamanho, setTamanho] = useState(ehBebida ? "unico" : "media");
  const [borda, setBorda] = useState("sem");
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const painelRef = useRef(null);

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aoFechar]);

  const precoBase = ehBebida ? produto.precos.unico : produto.precos[tamanho];
  const precoBorda = ehBebida
    ? 0
    : (BORDAS.find((b) => b.id === borda)?.preco ?? 0);
  const total = (precoBase + precoBorda) * quantidade;

  const confirmar = () => {
    adicionar(produto, { tamanho, borda, quantidade, observacao });
    aoFechar();
  };

  return (
    <div
      className="sobreposicao"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex={-1}
        ref={painelRef}
      >
        <button
          type="button"
          className="modal__fechar"
          onClick={aoFechar}
          aria-label="Fechar"
        >
          <IconeFechar />
        </button>

        <div className="modal__arte">
          <FotoProduto produto={produto} tamanho="grande" />
        </div>

        <div className="modal__conteudo">
          <h2 id="modal-titulo" className="modal__titulo">
            {produto.nome}
          </h2>
          <p className="modal__descricao">{produto.descricao}</p>

          {!ehBebida && (
            <>
              <fieldset className="opcoes">
                <legend className="opcoes__legenda">Tamanho</legend>
                <div className="opcoes__grade">
                  {TAMANHOS.map((t) => (
                    <label
                      key={t.id}
                      className={`opcao ${tamanho === t.id ? "opcao--ativa" : ""}`}
                    >
                      <input
                        type="radio"
                        name="tamanho"
                        value={t.id}
                        checked={tamanho === t.id}
                        onChange={() => setTamanho(t.id)}
                        className="sr-only"
                      />
                      <span className="opcao__nome">{t.nome}</span>
                      <span className="opcao__detalhe">
                        {t.fatias} fatias, serve {t.serve}
                      </span>
                      <span className="opcao__preco">
                        {moeda(produto.precos[t.id])}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="opcoes">
                <legend className="opcoes__legenda">Borda</legend>
                <div className="opcoes__linha">
                  {BORDAS.map((b) => (
                    <label
                      key={b.id}
                      className={`opcao opcao--compacta ${borda === b.id ? "opcao--ativa" : ""}`}
                    >
                      <input
                        type="radio"
                        name="borda"
                        value={b.id}
                        checked={borda === b.id}
                        onChange={() => setBorda(b.id)}
                        className="sr-only"
                      />
                      <span className="opcao__nome">{b.nome}</span>
                      {b.preco > 0 && (
                        <span className="opcao__preco">+ {moeda(b.preco)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <label className="campo">
            <span className="campo__rotulo">
              Alguma observação para a cozinha?
            </span>
            <input
              type="text"
              className="campo__entrada"
              value={observacao}
              maxLength={90}
              placeholder="Sem cebola, bem assada, cortar em 8..."
              onChange={(e) => setObservacao(e.target.value)}
            />
          </label>

          <div className="modal__acoes">
            <div className="contador" role="group" aria-label="Quantidade">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                disabled={quantidade === 1}
              >
                <IconeMenos width={16} height={16} />
              </button>
              <span aria-live="polite">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.min(20, q + 1))}
                aria-label="Aumentar quantidade"
              >
                <IconeMais width={16} height={16} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn--ambar modal__confirmar"
              onClick={confirmar}
            >
              Adicionar {moeda(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
