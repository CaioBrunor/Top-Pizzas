import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { LojaProvider } from "./context/LojaContext";
import { CarrinhoProvider } from "./context/CarrinhoContext";
import { AuthProvider } from "./context/AuthContext";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/componentes.css";
import "./styles/admin.css";

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
