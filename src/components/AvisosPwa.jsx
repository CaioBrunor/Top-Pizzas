import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLoja } from "../context/LojaContext";
import { urlDaFoto } from "../lib/format";
import { ler, gravar } from "../lib/persistencia";
import { useOnline } from "../lib/tempoReal";
import {
  aplicarAtualizacao,
  guardarFotos,
  instalarApp,
  usePwa,
} from "../pwa/registrar";
import { IconeSemSinal } from "./Icones";

export default function AvisosPwa() {
  const { instalavel, atualizacaoPronta } = usePwa();
  const { produtos, catalogoSincronizado } = useLoja();
  const online = useOnline();
  const { pathname } = useLocation();
  const [recusou, setRecusou] = useState(() => ler("pwa:recusou", false));

  // Com o cardápio do servidor em mãos, guarda as fotos para o modo offline.
  useEffect(() => {
    if (!catalogoSincronizado) return;
    guardarFotos(
      produtos.filter((p) => p.imagem?.startsWith("/")).map((p) => urlDaFoto(p.imagem)),
    );
  }, [produtos, catalogoSincronizado]);

  const dispensarConvite = () => {
    setRecusou(true);
    gravar("pwa:recusou", true);
  };

  // O convite aparece só na vitrine, para não atrapalhar quem está fechando
  // um pedido ou trabalhando no painel. O rodapé tem o botão o tempo todo.
  const convidar =
    instalavel &&
    !recusou &&
    !atualizacaoPronta &&
    (pathname === "/" || pathname === "/cardapio");

  return (
    <div className="pwa-avisos">
      {!online && (
        <p className="pwa-chip" role="status">
          <IconeSemSinal width={16} height={16} />
          Sem internet. Mostrando os dados salvos neste aparelho.
        </p>
      )}

      {atualizacaoPronta && (
        <div className="pwa-cartao" role="status">
          <div>
            <p className="pwa-cartao__titulo">Tem versão nova do site</p>
            <p>Atualize para usar as últimas melhorias.</p>
          </div>
          <div className="pwa-cartao__acoes">
            <button
              type="button"
              className="btn btn--ambar btn--pequeno"
              onClick={aplicarAtualizacao}
            >
              Atualizar agora
            </button>
          </div>
        </div>
      )}

      {convidar && (
        <div className="pwa-cartao">
          <div>
            <p className="pwa-cartao__titulo">Instale o app do Top Pizzas</p>
            <p>Abre direto da tela inicial e mostra o cardápio até sem internet.</p>
          </div>
          <div className="pwa-cartao__acoes">
            <button
              type="button"
              className="btn btn--ambar btn--pequeno"
              onClick={instalarApp}
            >
              Instalar
            </button>
            <button
              type="button"
              className="btn btn--fantasma btn--pequeno"
              onClick={dispensarConvite}
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
