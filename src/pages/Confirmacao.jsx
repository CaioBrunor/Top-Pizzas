import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useLoja } from "../context/LojaContext";
import { FLUXO_STATUS, dataHora, moeda, statusInfo } from "../lib/format";
import { IconeCheck, IconeSeta } from "../components/Icones";

const NOMES_PAGAMENTO = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  dinheiro: "Dinheiro na entrega",
};

export default function Confirmacao() {
  const { id } = useParams();
  const { pedidos, atualizarStatus } = useLoja();
  const pedido = pedidos.find((p) => p.id === id);

  useEffect(() => {
    if (!pedido) return undefined;
    const indice = FLUXO_STATUS.indexOf(pedido.status);
    if (indice === -1 || indice >= 3) return undefined;

    const t = setTimeout(
      () => atualizarStatus(pedido.id, FLUXO_STATUS[indice + 1]),
      22000,
    );
    return () => clearTimeout(t);
  }, [pedido, atualizarStatus]);

  if (!pedido) {
    return (
      <section className="pagina">
        <div className="wrap vazio-pagina">
          <h1>Pedido não encontrado</h1>
          <p>Esse código não existe mais neste navegador.</p>
          <Link to="/cardapio" className="btn btn--ambar">
            Voltar ao cardápio
          </Link>
        </div>
      </section>
    );
  }

  const indiceAtual = FLUXO_STATUS.indexOf(pedido.status);
  const cancelado = pedido.status === "cancelado";

  return (
    <section className="pagina">
      <div className="wrap confirmacao">
        <header className="confirmacao__topo">
          <span className="confirmacao__selo">
            <IconeCheck width={22} height={22} />
          </span>
          <div>
            <h1>Pedido confirmado</h1>
            <p className="confirmacao__codigo">
              Código {pedido.id} · feito em {dataHora(pedido.criadoEm)}
            </p>
          </div>
        </header>

        {cancelado ? (
          <div className="nota nota--atencao">
            <p className="nota__titulo">Pedido cancelado</p>
            <p>Fale com a loja no (83) 3333-0110 se isso não foi você.</p>
          </div>
        ) : (
          <ol className="rastreio">
            {FLUXO_STATUS.map((s, i) => {
              const info = statusInfo(s);
              const feito = i <= indiceAtual;
              return (
                <li
                  key={s}
                  className={`rastreio__etapa ${feito ? "rastreio__etapa--feita" : ""} ${
                    i === indiceAtual ? "rastreio__etapa--atual" : ""
                  }`}
                >
                  <span className="rastreio__ponto" />
                  <span className="rastreio__nome">{info.nome}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="confirmacao__grade">
          <div className="bloco">
            <p className="bloco__legenda">O que vem</p>
            <ul className="resumo-caixa__itens">
              {pedido.itens.map((i) => (
                <li key={i.linhaId}>
                  <span>
                    {i.quantidade}x {i.nome}
                    <em>
                      {i.tamanhoNome}
                      {i.borda !== "sem" && i.bordaNome
                        ? ` · ${i.bordaNome}`
                        : ""}
                      {i.observacao ? ` · ${i.observacao}` : ""}
                    </em>
                  </span>
                  <strong>{moeda(i.precoUnitario * i.quantidade)}</strong>
                </li>
              ))}
            </ul>
            <dl className="resumo">
              <div className="resumo__linha">
                <dt>Subtotal</dt>
                <dd>{moeda(pedido.subtotal)}</dd>
              </div>
              <div className="resumo__linha">
                <dt>
                  {pedido.entrega.tipo === "retirada" ? "Retirada" : "Entrega"}
                </dt>
                <dd>
                  {pedido.taxaEntrega === 0
                    ? "Grátis"
                    : moeda(pedido.taxaEntrega)}
                </dd>
              </div>
              <div className="resumo__linha resumo__linha--total">
                <dt>Total</dt>
                <dd>{moeda(pedido.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="bloco">
            <p className="bloco__legenda">Para onde vai</p>
            <dl className="revisao">
              <div>
                <dt>Cliente</dt>
                <dd>
                  {pedido.cliente.nome}
                  <br />
                  {pedido.cliente.telefone}
                </dd>
              </div>
              <div>
                <dt>
                  {pedido.entrega.tipo === "retirada" ? "Retirada" : "Endereço"}
                </dt>
                <dd>
                  {pedido.entrega.tipo === "retirada"
                    ? "Rua 1, 333 — Alto Branco"
                    : `${pedido.entrega.rua}, ${pedido.entrega.numero} — ${pedido.entrega.bairro}`}
                </dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{NOMES_PAGAMENTO[pedido.pagamento.metodo]}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="confirmacao__acoes">
          <Link to="/cardapio" className="btn btn--linha">
            Pedir mais alguma coisa
          </Link>
          <Link to="/admin" className="btn btn--fantasma">
            Ver este pedido no painel
            <IconeSeta width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
