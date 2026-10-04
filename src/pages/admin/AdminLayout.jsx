import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  IconeLista,
  IconePainel,
  IconePessoas,
  IconePizza,
  IconeSair,
  IconeVoltar,
} from "../../components/Icones";

const LINKS = [
  { para: "/admin/painel", nome: "Dashboard", Icone: IconePainel },
  { para: "/admin/pedidos", nome: "Pedidos", Icone: IconeLista },
  { para: "/admin/produtos", nome: "Produtos", Icone: IconePizza },
  { para: "/admin/clientes", nome: "Clientes", Icone: IconePessoas },
];

export default function AdminLayout() {
  const { autenticado, sessao, sair } = useAuth();

  if (!autenticado) return <Navigate to="/admin" replace />;

  return (
    <div className="admin">
      <aside className="admin__lateral">
        <Link to="/" className="admin__marca">
          Top<span>Pizzas</span>
          <em>painel</em>
        </Link>

        <nav className="admin__nav" aria-label="Áreas do painel">
          {LINKS.map(({ para, nome, Icone }) => (
            <NavLink
              key={para}
              to={para}
              className={({ isActive }) =>
                `admin__link ${isActive ? "admin__link--ativo" : ""}`
              }
            >
              <Icone width={18} height={18} />
              {nome}
            </NavLink>
          ))}
        </nav>

        <div className="admin__pe">
          <p className="admin__usuario">
            {sessao.nome}
            <span>{sessao.usuario}</span>
          </p>
          <Link to="/" className="admin__acao">
            <IconeVoltar width={16} height={16} />
            Ir para o site
          </Link>
          <button type="button" className="admin__acao" onClick={sair}>
            <IconeSair width={16} height={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="admin__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
