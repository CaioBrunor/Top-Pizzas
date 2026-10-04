import { useMemo, useState } from "react";
import CartaoProduto from "../components/CartaoProduto";
import ModalProduto from "../components/ModalProduto";
import { CATEGORIAS } from "../data/catalogo";
import { useLoja } from "../context/LojaContext";

export default function Cardapio() {
  const { produtos } = useLoja();
  const [categoria, setCategoria] = useState("todas");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const bateCategoria = categoria === "todas" || p.categoria === categoria;
      const bateBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo);
      return bateCategoria && bateBusca;
    });
  }, [produtos, categoria, busca]);

  return (
    <section className="pagina">
      <div className="wrap">
        <header className="pagina__cabecalho">
          <h1>Cardápio</h1>
        </header>

        <div className="filtros">
          <div className="filtros__abas" role="tablist" aria-label="Categorias">
            <button
              type="button"
              role="tab"
              aria-selected={categoria === "todas"}
              className={`aba ${categoria === "todas" ? "aba--ativa" : ""}`}
              onClick={() => setCategoria("todas")}
            >
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={categoria === c.id}
                className={`aba ${categoria === c.id ? "aba--ativa" : ""}`}
                onClick={() => setCategoria(c.id)}
              >
                {c.nome}
              </button>
            ))}
          </div>

          <label className="filtros__busca">
            <span className="sr-only">Buscar no cardápio</span>
            <input
              type="search"
              className="campo__entrada"
              placeholder="Buscar por sabor ou ingrediente"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
        </div>

        {filtrados.length === 0 ? (
          <p className="vazio">
            Nada com esse nome no cardápio. Tente buscar por um ingrediente, como &ldquo;calabresa&rdquo; ou &ldquo;queijo&rdquo;.
          </p>
        ) : (
          <div className="grade">
            {filtrados.map((produto) => (
              <CartaoProduto
                key={produto.id}
                produto={produto}
                aoEscolher={setSelecionado}
              />
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <ModalProduto
          produto={selecionado}
          aoFechar={() => setSelecionado(null)}
        />
      )}
    </section>
  );
}
