import { useMemo, useState } from "react";
import { useLoja } from "../../context/LojaContext";
import { STATUS_PEDIDO, dataHora, moeda, proximoStatus, statusInfo } from "../../lib/format";
import { IconeSeta } from "../../components/Icones";

const NOMES_PAGAMENTO = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export default function Pedidos() {
  const { pedidos, atualizarStatus } = useLoja();
  const [filtro, setFiltro] = useState("abertos");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      const bateFiltro =
        filtro === "todos"
          ? true
          : filtro === "abertos"
            ? !["entregue", "cancelado"].includes(p.status)
            : p.status === filtro;
      const bateBusca =
        !termo ||
        p.id.toLowerCase().includes(termo) ||
        p.cliente.nome.toLowerCase().includes(termo) ||
        p.cliente.telefone.includes(termo);
      return bateFiltro && bateBusca;
    });
  }, [pedidos, filtro, busca]);

  return (
    <>
      <header className="admin__cabecalho">
        <div>
          <h1>Pedidos</h1>
          <p className="admin__apoio">
            {lista.length} {lista.length === 1 ? "pedido" : "pedidos"} nesta visão.
          </p>
        </div>
        <label className="admin__busca">
          <span className="sr-only">Buscar pedido</span>
          <input
            type="search"
            className="campo__entrada"
            placeholder="Código, nome ou telefone"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </header>

      <div className="filtros__abas filtros__abas--admin">
        {[
          { id: "abertos", nome: "Em aberto" },
          { id: "todos", nome: "Todos" },
          ...STATUS_PEDIDO,
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`aba ${filtro === f.id ? "aba--ativa" : ""}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.nome}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="vazio">Nenhum pedido nessa combinação de filtros.</p>
      ) : (
        <div className="pedidos">
          {lista.map((p) => {
            const proximo = proximoStatus(p.status);
            const aberto = expandido === p.id;

            return (
              <article key={p.id} className="pedido">
                <button
                  type="button"
                  className="pedido__topo"
                  onClick={() => setExpandido(aberto ? null : p.id)}
                  aria-expanded={aberto}
                >
                  <span className="pedido__codigo">{p.id}</span>
                  <span className="pedido__cliente">
                    {p.cliente.nome}
                    <em>
                      {p.entrega.tipo === "retirada"
                        ? "Retirada na loja"
                        : `${p.entrega.bairro} · ${NOMES_PAGAMENTO[p.pagamento.metodo]}`}
                    </em>
                  </span>
                  <span className="pedido__hora">{dataHora(p.criadoEm)}</span>
                  <span className={`selo ${statusInfo(p.status).cor}`}>
                    {statusInfo(p.status).nome}
                  </span>
                  <span className="pedido__total">{moeda(p.total)}</span>
                </button>

                {aberto && (
                  <div className="pedido__detalhe">
                    <div className="pedido__coluna">
                      <p className="pedido__legenda">Itens</p>
                      <ul className="pedido__itens">
                        {p.itens.map((i) => (
                          <li key={i.linhaId}>
                            <span>
                              {i.quantidade}x {i.nome} — {i.tamanhoNome}
                              {i.borda !== "sem" && i.bordaNome ? ` · ${i.bordaNome}` : ""}
                            </span>
                            {i.observacao && <em>{i.observacao}</em>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pedido__coluna">
                      <p className="pedido__legenda">Contato e entrega</p>
                      <p className="pedido__texto">
                        {p.cliente.telefone}
                        <br />
                        {p.cliente.email || "sem e-mail"}
                        <br />
                        {p.entrega.tipo === "retirada"
                          ? "Retirada no balcão"
                          : `${p.entrega.rua}, ${p.entrega.numero} — ${p.entrega.bairro}`}
                      </p>
                    </div>

                    <div className="pedido__coluna pedido__coluna--acoes">
                      <p className="pedido__legenda">Mover status</p>
                      <div className="pedido__botoes">
                        {proximo && (
                          <button
                            type="button"
                            className="btn btn--ambar btn--pequeno"
                            onClick={() => atualizarStatus(p.id, proximo)}
                          >
                            {statusInfo(proximo).nome}
                            <IconeSeta width={15} height={15} />
                          </button>
                        )}
                        {p.status !== "cancelado" && p.status !== "entregue" && (
                          <button
                            type="button"
                            className="btn btn--linha btn--pequeno"
                            onClick={() => atualizarStatus(p.id, "cancelado")}
                          >
                            Cancelar
                          </button>
                        )}
                        {(p.status === "cancelado" || p.status === "entregue") && (
                          <button
                            type="button"
                            className="btn btn--linha btn--pequeno"
                            onClick={() => atualizarStatus(p.id, "recebido")}
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
