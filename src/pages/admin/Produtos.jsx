import { useState } from "react";
import { useLoja } from "../../context/LojaContext";
import { usePainel } from "../../context/PainelContext";
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

export default function Produtos() {
  const { produtos } = useLoja();
  const {
    salvarProduto,
    definirDisponibilidade,
    removerProduto,
    restaurarDados,
  } = usePainel();
  const [editando, setEditando] = useState(null);

  const abrirNovo = () => setEditando({ ...VAZIO, novo: true });
  const abrirEdicao = (p) => setEditando({ ...p, novo: false });

  const excluir = (p) => {
    if (window.confirm(`Excluir "${p.nome}" do cardápio? Isso não pode ser desfeito.`)) {
      removerProduto(p.id);
    }
  };

  const restaurar = () => {
    if (
      window.confirm(
        "Restaurar os dados de exemplo? O cardápio volta ao original e todos os pedidos atuais são apagados.",
      )
    ) {
      restaurarDados();
    }
  };

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
            onClick={restaurar}
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
                    onClick={() => definirDisponibilidade(p.id, !p.disponivel)}
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
                      onClick={() => excluir(p)}
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
          aoSalvar={async (p) => {
            await salvarProduto(p);
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
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const ehBebida = form.tipo === "bebida";

  const semErro = (campo) => {
    setErros((e) => ({ ...e, [campo]: undefined }));
    setErroGeral("");
  };
  const definir = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    semErro(campo);
  };
  const definirPreco = (chave, valor) => {
    setForm((f) => ({
      ...f,
      precos: { ...f.precos, [chave]: mascaraPreco(valor) },
    }));
    semErro(`precos.${chave}`);
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      setErros({ nome: "Dê um nome ao produto." });
      return;
    }
    const precos = ehBebida
      ? { unico: precoParaNumero(form.precos.unico) }
      : {
          broto: precoParaNumero(form.precos.broto),
          media: precoParaNumero(form.precos.media),
          grande: precoParaNumero(form.precos.grande),
        };
    // Produto novo vai sem id: quem cria o identificador é o servidor.
    const { novo, tipo, criadoEm, atualizadoEm, ...dados } = form;
    if (novo) delete dados.id;

    setSalvando(true);
    try {
      await aoSalvar({ ...dados, precos });
    } catch (erro) {
      setErros(erro.campos ?? {});
      setErroGeral(erro.campos ? "Confira os campos destacados." : erro.message);
      setSalvando(false);
    }
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
                maxLength={60}
                aria-invalid={erros.nome ? "true" : undefined}
                onChange={(e) => definir("nome", e.target.value)}
              />
              {erros.nome && <span className="campo__erro">{erros.nome}</span>}
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
                aria-invalid={erros.tempoPreparo ? "true" : undefined}
                onChange={(e) =>
                  definir(
                    "tempoPreparo",
                    Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0,
                  )
                }
              />
              {erros.tempoPreparo && (
                <span className="campo__erro">{erros.tempoPreparo}</span>
              )}
            </label>

            <label className="campo campo--largo">
              <span className="campo__rotulo">
                Caminho da foto (deixe vazio se ainda não tiver)
              </span>
              <input
                className="campo__entrada"
                value={form.imagem ?? ""}
                placeholder="/assets/pizzas/nome-do-arquivo.png"
                maxLength={300}
                aria-invalid={erros.imagem ? "true" : undefined}
                onChange={(e) =>
                  definir("imagem", e.target.value.trim() || null)
                }
              />
              {erros.imagem && (
                <span className="campo__erro">{erros.imagem}</span>
              )}
            </label>

            <label className="campo campo--largo">
              <span className="campo__rotulo">Descrição</span>
              <textarea
                className="campo__entrada"
                rows={3}
                value={form.descricao}
                maxLength={300}
                onChange={(e) => definir("descricao", e.target.value)}
              />
              {erros.descricao && (
                <span className="campo__erro">{erros.descricao}</span>
              )}
            </label>

            {ehBebida ? (
              <CampoPreco
                rotulo="Preço unitário"
                valor={form.precos.unico}
                erro={erros["precos.unico"]}
                aoMudar={(v) => definirPreco("unico", v)}
              />
            ) : (
              ["broto", "media", "grande"].map((t) => (
                <CampoPreco
                  key={t}
                  rotulo={`Preço ${t === "media" ? "média" : t}`}
                  valor={form.precos[t]}
                  erro={erros[`precos.${t}`]}
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

          {erroGeral && (
            <p className="campo__erro" role="alert">
              {erroGeral}
            </p>
          )}

          <div className="modal__acoes modal__acoes--form">
            <button
              type="button"
              className="btn btn--fantasma"
              onClick={aoFechar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--ambar"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoPreco({ rotulo, valor, erro, aoMudar }) {
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
          aria-invalid={erro ? "true" : undefined}
          onChange={(e) => aoMudar(e.target.value)}
        />
      </span>
      {erro && <span className="campo__erro">{erro}</span>}
    </label>
  );
}
