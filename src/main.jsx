import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { LojaProvider } from "./context/LojaContext";
import { CarrinhoProvider } from "./context/CarrinhoContext";
import { AuthProvider } from "./context/AuthContext";
import { limpar } from "./lib/persistencia";
import { iniciarTempoReal } from "./lib/tempoReal";
import { prepararPwa } from "./pwa/registrar";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/componentes.css";
import "./styles/admin.css";

// Sobras da versão sem servidor: o login simulado e os pedidos de exemplo
// que ficavam no navegador.
["sessao", "pedidos"].forEach(limpar);

iniciarTempoReal();
prepararPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LojaProvider>
          <CarrinhoProvider>
            <App />
          </CarrinhoProvider>
        </LojaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
