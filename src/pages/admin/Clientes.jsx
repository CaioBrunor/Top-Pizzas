import { useMemo, useState } from "react";
import { useLoja } from "../../context/LojaContext";
import { dataHora, moeda } from "../../lib/format";

export default function Clientes() {
  const { clientes } = useLoja();
  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.includes(termo) ||
        c.bairro.toLowerCase().includes(termo),
    );
  }, [clientes, busca]);

  const recorrentes = clientes.filter((c) => c.pedidos > 1).length;

  return (
    <>
      <header className="admin__cabecalho">
        <div>
          <h1>Clientes</h1>
          <p className="admin__apoio">
            {clientes.length} pessoas já pediram. {recorrentes} voltaram mais de uma vez.
          </p>
        </div>
        <label className="admin__busca">
          <span className="sr-only">Buscar cliente</span>
          <input
            type="search"
            className="campo__entrada"
            placeholder="Nome, telefone ou bairro"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </header>

      {lista.length === 0 ? (
        <p className="vazio">Ninguém com esse nome ainda.</p>
      ) : (
        <div className="tabela-area">
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Bairro</th>
                <th>Pedidos</th>
                <th>Último pedido</th>
                <th className="tabela--direita">Gasto total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td data-rotulo="Cliente">
                    <div className="cliente-celula">
                      <span className="cliente-celula__inicial" aria-hidden="true">
                        {c.nome.charAt(0)}
                      </span>
                      <strong>{c.nome}</strong>
                    </div>
                  </td>
                  <td data-rotulo="Contato">
                    <div>
                      {c.telefone}
                      <span className="tabela__secundario">
                        {c.email || "sem e-mail"}
                      </span>
                    </div>
                  </td>
                  <td data-rotulo="Bairro">{c.bairro}</td>
                  <td data-rotulo="Pedidos">
                    <div className="celula-pedidos">
                      {c.pedidos}
                      {c.pedidos > 2 && (
                        <span className="selo selo--basil">recorrente</span>
                      )}
                    </div>
                  </td>
                  <td data-rotulo="Último pedido">{dataHora(c.ultimoPedido)}</td>
                  <td className="tabela--direita" data-rotulo="Gasto total">
                    {moeda(c.gastoTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
