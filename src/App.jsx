import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";

import Cabecalho from "./components/Cabecalho";
import Rodape from "./components/Rodape";
import GavetaCarrinho from "./components/GavetaCarrinho";
import Aviso from "./components/Aviso";

import Inicio from "./pages/Inicio";
import Cardapio from "./pages/Cardapio";
import Checkout from "./pages/Checkout";
import Confirmacao from "./pages/Confirmacao";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Pedidos from "./pages/admin/Pedidos";
import Produtos from "./pages/admin/Produtos";
import Clientes from "./pages/admin/Clientes";

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
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id" element={<Confirmacao />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Route>

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="painel" element={<Dashboard />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="clientes" element={<Clientes />} />
        </Route>
      </Routes>
    </>
  );
}
