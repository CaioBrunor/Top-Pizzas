import { useState } from "react";
import { useLoja } from "../../context/LojaContext";
import { CATEGORIAS } from "../../data/catalogo";
import {
  mascaraPreco,
  moeda,
  numeroParaPreco,
  precoParaNumero,
} from "../../lib/format";
import FotoProduto from "../../components/FotoProduto";
import { IconeFechar, IconeMais } from "../../components/Icones";

const VAZIO = {
  id: "",
  nome: "",
  categoria: "tradicionais",
  tipo: "pizza",
  descricao: "",
  imagem: null,
  precos: { broto: "", media: "", grande: "", unico: "" },
  tempoPreparo: 18,
  disponivel: true,
  destaque: false,
  tags: [],
};

const slug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function Produtos() {
  const {
    produtos,
    salvarProduto,
    alternarDisponibilidade,
    removerProduto,
    restaurarDados,
  } = useLoja();
  const [editando, setEditando] = useState(null);

  const abrirNovo = () => setEditando({ ...VAZIO, novo: true });
  const abrirEdicao = (p) => setEditando({ ...p, novo: false });

  return (
    <>
      <header className="admin__cabecalho">
        <div>
          <h1>Produtos</h1>
          <p className="admin__apoio">
            {produtos.filter((p) => p.disponivel).length} de {produtos.length}{" "}
            no cardápio de hoje.
          </p>
        </div>
        <div className="admin__cabecalho-acoes">
          <button
            type="button"
            className="btn btn--linha btn--pequeno"
            onClick={restaurarDados}
          >
            Restaurar dados de exemplo
          </button>
          <button
            type="button"
            className="btn btn--ambar btn--pequeno"
            onClick={abrirNovo}
          >
            <IconeMais width={16} height={16} />
            Novo produto
          </button>
        </div>
      </header>

      <div className="tabela-area">
        <table className="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preços</th>
              <th>No cardápio</th>
              <th className="tabela--direita">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id}>
                <td data-rotulo="Produto">
                  <div className="produto-celula">
                    <div className="produto-celula__arte">
                      <FotoProduto produto={p} tamanho="mini" />
                    </div>
                    <div>
                      <strong>{p.nome}</strong>
                      <span className="produto-celula__desc">
                        {p.descricao}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-rotulo="Categoria">
                  {CATEGORIAS.find((c) => c.id === p.categoria)?.nome ??
                    p.categoria}
                </td>
                <td className="tabela__precos" data-rotulo="Preços">
                  {p.tipo === "bebida"
                    ? moeda(p.precos.unico)
                    : ["broto", "media", "grande"]
                        .map((t) => moeda(p.precos[t]))
                        .join("  ·  ")}
                </td>
                <td data-rotulo="No cardápio">
                  <button
                    type="button"
                    className={`interruptor ${p.disponivel ? "interruptor--ligado" : ""}`}
                    onClick={() => alternarDisponibilidade(p.id)}
                    aria-pressed={p.disponivel}
                    aria-label={`${p.disponivel ? "Tirar" : "Colocar"} ${p.nome} no cardápio`}
                  >
                    <span />
                  </button>
                </td>
                <td className="tabela--direita" data-rotulo="Ações">
                  <div className="celula-acoes">
                    <button
                      type="button"
                      className="btn btn--fantasma btn--pequeno"
                      onClick={() => abrirEdicao(p)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--fantasma btn--pequeno tabela__perigo"
                      onClick={() => removerProduto(p.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <FormularioProduto
          produto={editando}
          aoSalvar={(p) => {
            salvarProduto(p);
            setEditando(null);
          }}
          aoFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}

function FormularioProduto({ produto, aoSalvar, aoFechar }) {
  const [form, setForm] = useState(() => ({
    ...produto,
    precos: {
      broto: numeroParaPreco(produto.precos?.broto),
      media: numeroParaPreco(produto.precos?.media),
      grande: numeroParaPreco(produto.precos?.grande),
      unico: numeroParaPreco(produto.precos?.unico),
    },
  }));
  const ehBebida = form.tipo === "bebida";

  const definir = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const definirPreco = (chave, valor) =>
    setForm((f) => ({
      ...f,
      precos: { ...f.precos, [chave]: mascaraPreco(valor) },
    }));

  const salvar = () => {
    if (!form.nome.trim()) return;
    const id = form.id || slug(form.nome);
    const precos = ehBebida
      ? { unico: precoParaNumero(form.precos.unico) }
      : {
          broto: precoParaNumero(form.precos.broto),
          media: precoParaNumero(form.precos.media),
          grande: precoParaNumero(form.precos.grande),
        };
    const { novo, ...limpo } = form;
    aoSalvar({ ...limpo, id, precos });
  };

  return (
    <div
      className="sobreposicao"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="modal modal--form" role="dialog" aria-modal="true">
        <button
          type="button"
          className="modal__fechar"
          onClick={aoFechar}
          aria-label="Fechar"
        >
          <IconeFechar />
        </button>

        <div className="modal__conteudo modal__conteudo--form">
          <h2 className="modal__titulo">
            {produto.novo ? "Novo produto" : "Editar produto"}
          </h2>

          <div className="malha">
            <label className="campo campo--largo">
              <span className="campo__rotulo">Nome</span>
              <input
                className="campo__entrada"
                value={form.nome}
                onChange={(e) => definir("nome", e.target.value)}
              />
            </label>

            <label className="campo">
              <span className="campo__rotulo">Categoria</span>
              <select
                className="campo__entrada"
                value={form.categoria}
                onChange={(e) => {
                  const cat = e.target.value;
                  setForm((f) => ({
                    ...f,
                    categoria: cat,
                    tipo: cat === "bebidas" ? "bebida" : "pizza",
                  }));
                }}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span className="campo__rotulo">Preparo (min)</span>
              <input
                className="campo__entrada"
                inputMode="numeric"
                placeholder="18"
                value={form.tempoPreparo === 0 ? "" : form.tempoPreparo}
                onChange={(e) =>
                  definir(
                    "tempoPreparo",
                    Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0,
                  )
                }
              />
            </label>

            <label className="campo campo--largo">
              <span className="campo__rotulo">
                Caminho da foto (deixe vazio se ainda não tiver)
              </span>
              <input
                className="campo__entrada"
                value={form.imagem ?? ""}
                placeholder="/assets/pizzas/nome-do-arquivo.png"
                onChange={(e) =>
                  definir("imagem", e.target.value.trim() || null)
                }
              />
            </label>

            <label className="campo campo--largo">
              <span className="campo__rotulo">Descrição</span>
              <textarea
                className="campo__entrada"
                rows={3}
                value={form.descricao}
                onChange={(e) => definir("descricao", e.target.value)}
              />
            </label>

            {ehBebida ? (
              <CampoPreco
                rotulo="Preço unitário"
                valor={form.precos.unico}
                aoMudar={(v) => definirPreco("unico", v)}
              />
            ) : (
              ["broto", "media", "grande"].map((t) => (
                <CampoPreco
                  key={t}
                  rotulo={`Preço ${t === "media" ? "média" : t}`}
                  valor={form.precos[t]}
                  aoMudar={(v) => definirPreco(t, v)}
                />
              ))
            )}
          </div>

          <fieldset className="opcoes">
            <legend className="opcoes__legenda">Disponibilidade</legend>
            <div className="opcoes__linha">
              <label
                className={`opcao ${form.disponivel ? "opcao--ativa" : ""}`}
              >
                <input
                  type="radio"
                  name="disponivel"
                  className="sr-only"
                  checked={form.disponivel}
                  onChange={() => definir("disponivel", true)}
                />
                <span className="opcao__nome">Disponível</span>
                <span className="opcao__detalhe">Pode ser pedida hoje</span>
              </label>
              <label
                className={`opcao ${!form.disponivel ? "opcao--ativa" : ""}`}
              >
                <input
                  type="radio"
                  name="disponivel"
                  className="sr-only"
                  checked={!form.disponivel}
                  onChange={() => definir("disponivel", false)}
                />
                <span className="opcao__nome">Indisponível</span>
                <span className="opcao__detalhe">
                  Aparece marcada como fora do cardápio
                </span>
              </label>
            </div>
          </fieldset>

          <div className="interruptores">
            <label className="marcador">
              <input
                type="checkbox"
                checked={form.destaque}
                onChange={(e) => definir("destaque", e.target.checked)}
              />
              Destacar na home
            </label>
          </div>

          <div className="modal__acoes modal__acoes--form">
            <button
              type="button"
              className="btn btn--fantasma"
              onClick={aoFechar}
            >
              Cancelar
            </button>
            <button type="button" className="btn btn--ambar" onClick={salvar}>
              Salvar produto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoPreco({ rotulo, valor, aoMudar }) {
  return (
    <label className="campo">
      <span className="campo__rotulo">{rotulo}</span>
      <span className="campo-moeda">
        <span className="campo-moeda__sigla">R$</span>
        <input
          className="campo__entrada campo-moeda__entrada"
          inputMode="decimal"
          placeholder="0,00"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
        />
      </span>
    </label>
  );
}
