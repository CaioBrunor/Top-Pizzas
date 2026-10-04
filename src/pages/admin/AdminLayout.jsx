import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PainelProvider, usePainel } from "../../context/PainelContext";
import { useAoVivo } from "../../lib/tempoReal";
import {
  IconeCheck,
  IconeFechar,
  IconeLista,
  IconeMoto,
  IconePainel,
  IconePessoas,
  IconePizza,
  IconeSair,
  IconeVoltar,
} from "../../components/Icones";

const LINKS = [
  { para: "/admin/painel", nome: "Dashboard", Icone: IconePainel },
  { para: "/admin/pedidos", nome: "Pedidos", Icone: IconeLista },
  { para: "/admin/entregadores", nome: "Entregadores", Icone: IconeMoto },
  { para: "/admin/produtos", nome: "Produtos", Icone: IconePizza },
  { para: "/admin/clientes", nome: "Clientes", Icone: IconePessoas },
];

export default function AdminLayout() {
  const { autenticado } = useAuth();

  if (!autenticado) return <Navigate to="/admin" replace />;

  return (
    <PainelProvider>
      <Painel />
    </PainelProvider>
  );
}

function Painel() {
  const { sessao, sair } = useAuth();
  const { carregando, falha, aviso, dispensarAviso } = usePainel();
  const aoVivo = useAoVivo();
  const navegar = useNavigate();

  return (
    <div className="admin">
      <aside className="admin__lateral">
        <div className="admin__topo">
          <Link to="/" className="admin__marca">
            Top<span>Pizzas</span>
            <em>painel</em>
          </Link>
          <p
            className={`admin__vivo ${aoVivo ? "admin__vivo--ligado" : ""}`}
            role="status"
          >
            {aoVivo ? "Ao vivo" : "Reconectando..."}
          </p>
        </div>

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
        {falha && (
          <div className="nota nota--atencao" role="status">
            <p className="nota__titulo">Os dados podem estar desatualizados</p>
            <p>
              {falha} O painel mostra a última cópia guardada neste navegador e
              volta a atualizar sozinho quando a conexão retornar.
            </p>
          </div>
        )}
        {carregando ? (
          <p className="vazio">Carregando os dados da loja...</p>
        ) : (
          <Outlet />
        )}
      </main>

      <div className="aviso-area" role="status" aria-live="polite">
        {aviso && (
          <button
            type="button"
            className={`aviso ${aviso.erro ? "aviso--erro" : ""}`}
            onClick={() => {
              dispensarAviso();
              if (aviso.para) navegar(aviso.para);
            }}
          >
            {aviso.erro ? (
              <IconeFechar width={17} height={17} />
            ) : (
              <IconeCheck width={17} height={17} />
            )}
            <span>{aviso.texto}</span>
            {aviso.para && <span className="aviso__acao">ver pedidos</span>}
          </button>
        )}
      </div>
    </div>
  );
}
