import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLoja } from "../../context/LojaContext";
import { usePainel } from "../../context/PainelContext";
import { dataCurta, dataHora, etapaDoPedido, moeda } from "../../lib/format";

const DIAS = 7;

export default function Dashboard() {
  const { produtos } = useLoja();
  const { pedidos, clientes } = usePainel();

  const dados = useMemo(() => {
    const validos = pedidos.filter((p) => p.status !== "cancelado");
    const hoje = new Date().toDateString();

    const doDia = validos.filter(
      (p) => new Date(p.criadoEm).toDateString() === hoje,
    );
    const faturamentoDia = doDia.reduce((s, p) => s + p.total, 0);
    const faturamentoTotal = validos.reduce((s, p) => s + p.total, 0);
    const ticket = validos.length ? faturamentoTotal / validos.length : 0;

    const abertos = pedidos.filter(
      (p) => !["entregue", "cancelado"].includes(p.status),
    ).length;

    const serie = [];
    for (let i = DIAS - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const chave = d.toDateString();
      const doDiaI = validos.filter(
        (p) => new Date(p.criadoEm).toDateString() === chave,
      );
      serie.push({
        rotulo: dataCurta(d.toISOString()),
        valor: doDiaI.reduce((s, p) => s + p.total, 0),
        pedidos: doDiaI.length,
      });
    }

    const contagem = new Map();
    // Produto excluído do cardápio continua no ranking com o nome que tinha
    // quando foi vendido.
    const nomesVendidos = new Map();
    validos.forEach((p) =>
      p.itens.forEach((i) => {
        contagem.set(
          i.produtoId,
          (contagem.get(i.produtoId) ?? 0) + i.quantidade,
        );
        nomesVendidos.set(i.produtoId, i.nome);
      }),
    );
    const ranking = [...contagem.entries()]
      .map(([id, qtd]) => ({
        id,
        qtd,
        nome: produtos.find((p) => p.id === id)?.nome ?? nomesVendidos.get(id),
      }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);

    return {
      doDia,
      faturamentoDia,
      faturamentoTotal,
      ticket,
      abertos,
      serie,
      ranking,
    };
  }, [pedidos, produtos]);

  const maximo = Math.max(...dados.serie.map((d) => d.valor), 1);
  const recentes = pedidos.slice(0, 6);
  const clientesRecentes = [...clientes]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 5);

  return (
    <>
      <header className="admin__cabecalho">
        <div>
          <h1>Dashboard</h1>
          <p className="admin__apoio">Visão geral da operação.</p>
        </div>
      </header>

      <div className="kpis">
        <Kpi
          rotulo="Faturamento hoje"
          valor={moeda(dados.faturamentoDia)}
          apoio={`${dados.doDia.length} pedidos`}
        />
        <Kpi
          rotulo="Pedidos em aberto"
          valor={String(dados.abertos)}
          apoio="na fila da cozinha"
          destaque
        />
        <Kpi
          rotulo="Ticket médio"
          valor={moeda(dados.ticket)}
          apoio="todos os pedidos"
        />
        <Kpi
          rotulo="Faturamento acumulado"
          valor={moeda(dados.faturamentoTotal)}
          apoio="desde o primeiro pedido"
        />
      </div>

      <div className="admin__duas">
        <section className="painel">
          <h2 className="painel__titulo">Faturamento por dia</h2>
          <div className="grafico">
            {dados.serie.map((d) => (
              <div key={d.rotulo} className="grafico__coluna">
                <div className="grafico__valor">
                  {d.valor > 0 ? moeda(d.valor) : ""}
                </div>
                <div
                  className="grafico__barra"
                  style={{
                    height: `${Math.max((d.valor / maximo) * 100, 2)}%`,
                  }}
                  title={`${d.pedidos} pedidos`}
                />
                <div className="grafico__rotulo">{d.rotulo}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="painel">
          <h2 className="painel__titulo">Mais vendidas</h2>
          <ol className="ranking">
            {dados.ranking.map((r, i) => (
              <li key={r.id} className="ranking__item">
                <span className="ranking__posicao">{i + 1}</span>
                <span className="ranking__nome">{r.nome}</span>
                <span className="ranking__qtd">{r.qtd}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="painel">
        <div className="painel__cabecalho">
          <h2 className="painel__titulo">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="painel__atalho">
            Ver todos
          </Link>
        </div>

        <div className="tabela-area">
          <table className="tabela">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Quando</th>
                <th>Status</th>
                <th className="tabela--direita">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((p) => (
                <tr key={p.id}>
                  <td className="tabela__codigo" data-rotulo="Código">
                    {p.id}
                  </td>
                  <td data-rotulo="Cliente">{p.cliente.nome}</td>
                  <td data-rotulo="Quando">{dataHora(p.criadoEm)}</td>
                  <td data-rotulo="Status">
                    <span className={`selo ${etapaDoPedido(p).cor}`}>
                      {etapaDoPedido(p).nome}
                    </span>
                  </td>
                  <td className="tabela--direita" data-rotulo="Total">
                    {moeda(p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="painel">
        <div className="painel__cabecalho">
          <h2 className="painel__titulo">Clientes recentes</h2>
          <Link to="/admin/clientes" className="painel__atalho">
            Ver os {clientes.length}
          </Link>
        </div>

        <div className="tabela-area">
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Endereço atual</th>
                <th>Cadastro</th>
                <th className="tabela--direita">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {clientesRecentes.map((c) => (
                <tr key={c.id}>
                  <td data-rotulo="Cliente">{c.nome}</td>
                  <td data-rotulo="Contato">
                    <div>
                      {c.telefone}
                      <span className="tabela__secundario">{c.email}</span>
                    </div>
                  </td>
                  <td data-rotulo="Endereço atual">
                    {c.endereco?.rua
                      ? `${c.endereco.rua}, ${c.endereco.numero} — ${c.bairro}`
                      : c.bairro || "ainda não informado"}
                  </td>
                  <td className="tabela__data" data-rotulo="Cadastro">
                    {dataHora(c.criadoEm)}
                  </td>
                  <td className="tabela--direita" data-rotulo="Pedidos">
                    {c.pedidos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Kpi({ rotulo, valor, apoio, destaque = false }) {
  return (
    <article className={`kpi ${destaque ? "kpi--destaque" : ""}`}>
      <p className="kpi__rotulo">{rotulo}</p>
      <p className="kpi__valor">{valor}</p>
      <p className="kpi__apoio">{apoio}</p>
    </article>
  );
}
