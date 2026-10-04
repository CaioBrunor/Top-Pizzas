import { useCarrinho } from "../context/CarrinhoContext";
import { IconeCheck } from "./Icones";

export default function Aviso() {
  const { aviso, abrir } = useCarrinho();

  return (
    <div className="aviso-area" role="status" aria-live="polite">
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
