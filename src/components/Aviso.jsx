import { useLocation, useNavigate } from "react-router-dom";
import { useCarrinho } from "../context/CarrinhoContext";
import { useLoja } from "../context/LojaContext";
import { IconeCheck, IconeChama } from "./Icones";

export default function Aviso() {
  const { aviso, abrir } = useCarrinho();
  const { notificacao, dispensarNotificacao } = useLoja();
  const { pathname } = useLocation();
  const navegar = useNavigate();

  // Na página do próprio pedido a mudança já aparece no rastreio.
  const rotaDoPedido = notificacao && `/pedido/${notificacao.pedidoId}`;
  const mostrarPedido = notificacao && pathname !== rotaDoPedido;

  return (
    <div className="aviso-area" role="status" aria-live="polite">
      {mostrarPedido && (
        <button
          type="button"
          className="aviso aviso--pedido"
          onClick={() => {
            dispensarNotificacao();
            navegar(rotaDoPedido);
          }}
        >
          <IconeChama width={17} height={17} />
          <span>{notificacao.texto}</span>
          <span className="aviso__acao">acompanhar</span>
        </button>
      )}
      {aviso && (
        <button type="button" className="aviso" onClick={abrir}>
          <IconeCheck width={17} height={17} />
          <span>{aviso}</span>
          <span className="aviso__acao">ver carrinho</span>
        </button>
      )}
    </div>
  );
}
