import { useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Cabecalho from "./components/Cabecalho";
import Rodape from "./components/Rodape";
import GavetaCarrinho from "./components/GavetaCarrinho";
import Aviso from "./components/Aviso";
import AvisosPwa from "./components/AvisosPwa";
import { useAuth } from "./context/AuthContext";

import Inicio from "./pages/Inicio";
import Cardapio from "./pages/Cardapio";
import Checkout from "./pages/Checkout";
import Confirmacao from "./pages/Confirmacao";
import Entrar from "./pages/Entrar";
import Conta from "./pages/Conta";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Pedidos from "./pages/admin/Pedidos";
import Produtos from "./pages/admin/Produtos";
import Clientes from "./pages/admin/Clientes";
import Entregadores from "./pages/admin/Entregadores";
import EntregadorLogin from "./pages/entregador/EntregadorLogin";
import AreaDoEntregador from "./pages/entregador/Entregas";

function AoTrocarRota() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function LayoutSite() {
  return (
    <div className="site">
      <Cabecalho />
      <main className="site__conteudo">
        <Outlet />
      </main>
      <Rodape />
      <GavetaCarrinho />
      <Aviso />
    </div>
  );
}

function SoCliente() {
  const { clienteAutenticado } = useAuth();
  const { pathname } = useLocation();

  if (!clienteAutenticado) {
    return <Navigate to="/entrar" replace state={{ voltar: pathname }} />;
  }
  return <Outlet />;
}

function NaoEncontrado() {
  return (
    <section className="pagina">
      <div className="wrap vazio-pagina">
        <h1>Página não encontrada</h1>
        <p>Esse endereço não existe por aqui.</p>
        <a href="/" className="btn btn--ambar">
          Voltar ao início
        </a>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <AoTrocarRota />
      <Routes>
        <Route element={<LayoutSite />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route element={<SoCliente />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:id" element={<Confirmacao />} />
            <Route path="/conta" element={<Conta />} />
          </Route>
          <Route path="*" element={<NaoEncontrado />} />
        </Route>

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="painel" element={<Dashboard />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="entregadores" element={<Entregadores />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="clientes" element={<Clientes />} />
        </Route>

        <Route path="/entregador" element={<EntregadorLogin />} />
        <Route path="/entregador/entregas" element={<AreaDoEntregador />} />
      </Routes>
      <AvisosPwa />
    </>
  );
}
