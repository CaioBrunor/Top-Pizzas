import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCarrinho } from "../context/CarrinhoContext";
import { primeiroNome } from "../lib/format";
import { IconeSacola, IconeCadeado, IconePessoa, MarcaFatia } from "./Icones";

function LinkAncora({ para, children }) {
  const navegar = useNavigate();
  const { pathname } = useLocation();

  const rolar = (e) => {
    e.preventDefault();
    const ir = () => {
      const alvo = document.getElementById(para);
      if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (pathname === "/") {
      ir();
    } else {
      navegar("/");
      setTimeout(ir, 120);
    }
  };

  return (
    <a href={`/#${para}`} className="cabecalho__link" onClick={rolar}>
      {children}
    </a>
  );
}

export default function Cabecalho() {
  const { quantidadeTotal, abrir } = useCarrinho();
  const { cliente } = useAuth();
  const [colado, setColado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setColado(y > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgresso(total > 0 ? Math.min(y / total, 1) : 0);
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [pathname]);

  return (
    <header className={`cabecalho ${colado ? "cabecalho--colado" : ""}`}>
      <div className="cabecalho__interno wrap">
        <Link
          to="/"
          className="marca"
          aria-label="Top Pizzas, ir para a página inicial"
        >
          <MarcaFatia className="marca__fatia" />
          <span className="marca__texto">
            Top<span className="marca__texto-fino">Pizzas</span>
          </span>
        </Link>

        <nav className="cabecalho__nav" aria-label="Principal">
          <NavLink to="/" end className="cabecalho__link">
            Início
          </NavLink>
          <LinkAncora para="mais-pedidas">Mais pedidas</LinkAncora>
        </nav>

        <div className="cabecalho__acoes">
          <Link
            to="/admin"
            className="cabecalho__admin"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
          >
            <IconeCadeado width={16} height={16} />
            Entrar como admin
          </Link>

          <Link
            to={cliente ? "/conta" : "/entrar"}
            className="cabecalho__conta"
            aria-label={cliente ? "Minha conta" : "Entrar ou criar conta"}
          >
            <IconePessoa width={17} height={17} />
            <span className="cabecalho__conta-texto">
              {cliente ? primeiroNome(cliente.nome) : "Entrar"}
            </span>
          </Link>

          <button type="button" className="carrinho-botao" onClick={abrir}>
            <IconeSacola />
            <span className="carrinho-botao__texto">Carrinho</span>
            {quantidadeTotal > 0 && (
              <span className="carrinho-botao__contador">
                {quantidadeTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="cabecalho__progresso" aria-hidden="true">
        <span style={{ transform: `scaleX(${progresso})` }} />
      </div>
    </header>
  );
}
