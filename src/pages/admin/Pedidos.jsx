import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePainel } from "../../context/PainelContext";
import {
  STATUS_PEDIDO,
  dataHora,
  ehEntrega,
  etapaDoPedido,
  hora,
  moeda,
  primeiroNome,
  proximoStatus,
} from "../../lib/format";
import { IconeSeta } from "../../components/Icones";

const NOMES_PAGAMENTO = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export default function Pedidos() {
  const { pedidos, novos, marcarVisto } = usePainel();
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
            const aberto = expandido === p.id;
            const etapa = etapaDoPedido(p);
            const naRua = p.status === "entrega" && p.entregador;
            // Chegou pelo tempo real e ainda não foi aberto.
            const novo = novos.includes(p.id);

            return (
              <article
                key={p.id}
                className={`pedido ${novo ? "pedido--novo" : ""}`}
              >
                <button
                  type="button"
                  className="pedido__topo"
                  onClick={() => {
                    setExpandido(aberto ? null : p.id);
                    marcarVisto(p.id);
                  }}
                  aria-expanded={aberto}
                >
                  <span className="pedido__codigo">{p.id}</span>
                  <span className="pedido__cliente">
                    {p.cliente.nome}
                    <em>
                      {p.entrega.tipo === "retirada"
                        ? "Retirada na loja"
                        : `${p.entrega.bairro} · ${NOMES_PAGAMENTO[p.pagamento.metodo]}`}
                      {naRua ? ` · com ${primeiroNome(p.entregador.nome)}` : ""}
                    </em>
                  </span>
                  <span className="pedido__hora">{dataHora(p.criadoEm)}</span>
                  <span className={`selo ${etapa.cor}`}>{etapa.nome}</span>
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
                          : `${p.entrega.rua}, ${p.entrega.numero}${
                              p.entrega.complemento ? ` (${p.entrega.complemento})` : ""
                            } — ${p.entrega.bairro}`}
                        <br />
                        {NOMES_PAGAMENTO[p.pagamento.metodo]}
                        {p.pagamento.troco ? `, troco para ${moeda(p.pagamento.troco)}` : ""}
                        {p.entregador && (
                          <>
                            <br />
                            Entregador: {p.entregador.nome}
                          </>
                        )}
                        {p.confirmacao && (
                          <>
                            <br />
                            {p.confirmacao.tipo === "codigo"
                              ? "Entrega confirmada com o código do cliente"
                              : "Entrega fechada pelo painel, sem código"}{" "}
                            às {hora(p.confirmacao.em)}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="pedido__coluna pedido__coluna--acoes">
                      <p className="pedido__legenda">Mover status</p>
                      <AcoesDoPedido pedido={p} />
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

function AcoesDoPedido({ pedido }) {
  const { atualizarStatus, trocarEntregador, entregadores } = usePainel();
  const [escolhido, setEscolhido] = useState("");

  const proximo = proximoStatus(pedido.status);
  const encerrado = pedido.status === "cancelado" || pedido.status === "entregue";
  const emCasa = ehEntrega(pedido);
  // Pedido de entrega saindo do forno: precisa de alguém para levar.
  const vaiSair = emCasa && proximo === "entrega";
  const naRua = emCasa && pedido.status === "entrega";

  const disponiveis = entregadores.filter(
    (e) => e.ativo && e.id !== pedido.entregador?.id,
  );

  const fecharSemCodigo = () => {
    if (
      window.confirm(
        "Marcar como entregue sem o código do cliente? Use só quando o entregador não conseguiu confirmar pelo celular.",
      )
    ) {
      atualizarStatus(pedido.id, "entregue");
    }
  };

  const escolha = (vaiSair || naRua) && (
    <label className="pedido__entregador">
      <span className="sr-only">Entregador</span>
      <select
        className="campo__entrada"
        value={escolhido}
        onChange={(e) => setEscolhido(e.target.value)}
      >
        <option value="">
          {naRua && pedido.entregador ? "Trocar entregador..." : "Quem vai levar?"}
        </option>
        {disponiveis.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
            {e.naRua.length > 0 ? ` (${e.naRua.length} na rua)` : ""}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="pedido__botoes">
      {(vaiSair || naRua) && disponiveis.length === 0 && !pedido.entregador && (
        <p className="pedido__texto">
          Nenhum entregador ativo.{" "}
          <Link to="/admin/entregadores" className="painel__atalho">
            Cadastrar entregador
          </Link>
        </p>
      )}

      {vaiSair && disponiveis.length > 0 && (
        <>
          {escolha}
          <button
            type="button"
            className="btn btn--ambar btn--pequeno"
            disabled={!escolhido}
            onClick={() => atualizarStatus(pedido.id, "entrega", escolhido)}
          >
            Despachar
            <IconeSeta width={15} height={15} />
          </button>
        </>
      )}

      {naRua && (
        <>
          {disponiveis.length > 0 && (
            <>
              {escolha}
              <button
                type="button"
                className="btn btn--linha btn--pequeno"
                disabled={!escolhido}
                onClick={() => {
                  trocarEntregador(pedido.id, escolhido);
                  setEscolhido("");
                }}
              >
                {pedido.entregador ? "Trocar" : "Atribuir"}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn--linha btn--pequeno"
            onClick={fecharSemCodigo}
          >
            Entregue sem código
          </button>
        </>
      )}

      {proximo && !vaiSair && !naRua && (
        <button
          type="button"
          className="btn btn--ambar btn--pequeno"
          onClick={() => atualizarStatus(pedido.id, proximo)}
        >
          {etapaDoPedido(pedido, proximo).nome}
          <IconeSeta width={15} height={15} />
        </button>
      )}
      {!encerrado && (
        <button
          type="button"
          className="btn btn--linha btn--pequeno"
          onClick={() => atualizarStatus(pedido.id, "cancelado")}
        >
          Cancelar
        </button>
      )}
      {encerrado && (
        <button
          type="button"
          className="btn btn--linha btn--pequeno"
          onClick={() => atualizarStatus(pedido.id, "recebido")}
        >
          Reabrir
        </button>
      )}
    </div>
  );
}
