import { Link } from "react-router-dom";
import { instalarApp, usePwa } from "../pwa/registrar";
import { IconeBaixar } from "./Icones";

export default function Rodape() {
  const { instalavel } = usePwa();

  return (
    <footer className="rodape">
      <div className="wrap rodape__interno">
        <div className="rodape__bloco">
          <p className="rodape__marca">Top Pizzas</p>
          <p className="rodape__linha">
            Rua 1, 333 — Alto Branco
            <br />
            Campina Grande, PB
          </p>
        </div>

        <div className="rodape__bloco">
          <p className="rodape__titulo">Funcionamento</p>
          <p className="rodape__linha">
            Terça a domingo, 18h às 23h30
            <br />
            Segunda fechado
          </p>
        </div>

        <div className="rodape__bloco">
          <p className="rodape__titulo">Pedidos</p>
          <p className="rodape__linha">
            (83) 3333-1111
            <br />
            pedidos@toppizzas.com.br
          </p>
        </div>

        <div className="rodape__bloco">
          <p className="rodape__titulo">Equipe</p>
          <Link to="/admin" className="rodape__link">
            Painel administrativo
          </Link>
          <br />
          <Link to="/entregador" className="rodape__link">
            Área do entregador
          </Link>
        </div>

        {/* Só aparece quando o navegador permite instalar o site como app. */}
        {instalavel && (
          <div className="rodape__bloco">
            <p className="rodape__titulo">Aplicativo</p>
            <button
              type="button"
              className="rodape__botao"
              onClick={instalarApp}
            >
              <IconeBaixar width={16} height={16} />
              Instalar o app
            </button>
          </div>
        )}
      </div>

      <div className="wrap rodape__base">
        <p>Top Pizzas</p>
      </div>
    </footer>
  );
}
