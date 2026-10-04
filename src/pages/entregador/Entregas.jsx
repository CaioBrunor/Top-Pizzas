import { useState } from "react";
import { Navigate } from "react-router-dom";
import { IconeCheck, IconeSair, IconeSeta } from "../../components/Icones";
import { useAuth } from "../../context/AuthContext";
import { EntregadorProvider, useEntregas } from "../../context/EntregadorContext";
import { CIDADE } from "../../data/catalogo";
import {
  DIGITOS_DO_CODIGO,
  hora,
  moeda,
  primeiroNome,
  soDigitos,
} from "../../lib/format";
import { useAoVivo, useOnline } from "../../lib/tempoReal";

const SITUACAO_DA_POSICAO = {
  desligada: null,
  buscando: {
    texto: "Procurando sua posição...",
    ajuda: "Se o aparelho perguntar, permita o acesso à localização.",
  },
  ativa: {
    texto: "Sua posição está sendo compartilhada",
    ajuda: "O cliente e a loja acompanham no mapa. Deixe esta tela aberta durante a entrega.",
    ok: true,
  },
  negada: {
    texto: "O acesso à localização foi negado",
    ajuda: "Libere a localização para este site nas configurações do navegador. As entregas funcionam do mesmo jeito, mas o cliente não vê o mapa.",
  },
  indisponivel: {
    texto: "Este aparelho não informa a localização",
    ajuda: "As entregas funcionam do mesmo jeito, mas o cliente não vê o mapa.",
  },
  erro: {
    texto: "Não foi possível obter sua posição agora",
    ajuda: "Confira se o GPS está ligado. O app continua tentando.",
  },
};

export default function AreaDoEntregador() {
  const { entregador } = useAuth();

  if (!entregador) return <Navigate to="/entregador" replace />;

  return (
    <EntregadorProvider>
      <Entregas />
    </EntregadorProvider>
  );
}

function Entregas() {
  const { entregador, sairEntregador } = useAuth();
  const {
    entregas,
    concluidas,
    falha,
    aviso,
    dispensarAviso,
    localizacao,
    compartilhar,
    setCompartilhar,
  } = useEntregas();
  const aoVivo = useAoVivo();
  const posicao =
    SITUACAO_DA_POSICAO[localizacao] ?? SITUACAO_DA_POSICAO.buscando;

  return (
    <div className="rota">
      <header className="rota__topo">
        <div className="wrap rota__topo-interno">
          <div>
            <p className="rota__marca">
              Top<span>Pizzas</span> <em>entregas</em>
            </p>
            <p className="rota__quem">
              Olá, {primeiroNome(entregador.nome)}
              <span
                className={`admin__vivo ${aoVivo ? "admin__vivo--ligado" : ""}`}
                role="status"
              >
                {aoVivo ? "Ao vivo" : "Reconectando..."}
              </span>
            </p>
          </div>
          <button
            type="button"
            className="btn btn--linha btn--pequeno"
            onClick={sairEntregador}
          >
            <IconeSair width={16} height={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="wrap rota__conteudo">
        {falha && (
          <div className="nota nota--atencao" role="status">
            <p className="nota__titulo">Sem conexão com a loja</p>
            <p>
              {falha} As entregas abaixo são a última cópia guardada neste
              aparelho.
            </p>
          </div>
        )}

        {entregas.length > 0 && (
          <div
            className={`nota ${posicao.ok && compartilhar ? "nota--ok" : "nota--atencao"}`}
            role="status"
          >
            <p className="nota__titulo">
              {compartilhar
                ? posicao.texto
                : "Você desligou o compartilhamento da posição"}
            </p>
            <p>
              {compartilhar
                ? posicao.ajuda
                : "O cliente não vai ver onde o pedido está."}
            </p>
            <button
              type="button"
              className="rota__alternar"
              onClick={() => setCompartilhar(!compartilhar)}
            >
              {compartilhar ? "Parar de compartilhar" : "Voltar a compartilhar"}
            </button>
          </div>
        )}

        <section className="rota__secao" aria-labelledby="rota-entregas">
          <h1 id="rota-entregas" className="rota__titulo">
            Com você agora
            <span>{entregas.length}</span>
          </h1>

          {entregas.length === 0 ? (
            <div className="nota">
              <p className="nota__titulo">Nenhuma entrega com você</p>
              <p>
                Quando a loja despachar um pedido no seu nome, ele aparece aqui
                na hora.
              </p>
            </div>
          ) : (
            entregas.map((entrega) => (
              <CartaoDaEntrega key={entrega.id} entrega={entrega} />
            ))
          )}
        </section>

        {concluidas.length > 0 && (
          <section className="rota__secao" aria-labelledby="rota-feitas">
            <h2 id="rota-feitas" className="rota__titulo">
              Entregues hoje
              <span>{concluidas.length}</span>
            </h2>
            <ul className="rota__feitas">
              {concluidas.map((c) => (
                <li key={c.id}>
                  <IconeCheck width={16} height={16} />
                  <strong>{c.id}</strong>
                  <span>{c.bairro}</span>
                  <span>{hora(c.em)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <div className="aviso-area" role="status" aria-live="polite">
        {aviso && (
          <button type="button" className="aviso aviso--pedido" onClick={dispensarAviso}>
            <IconeCheck width={17} height={17} />
            <span>{aviso}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CartaoDaEntrega({ entrega }) {
  const { confirmar } = useEntregas();
  const online = useOnline();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { cliente, entrega: destino, pagamento, itens, total } = entrega;
  const endereco = `${destino.rua}, ${destino.numero}`;
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${endereco}, ${destino.bairro}, ${CIDADE}`,
  )}`;
  const emDinheiro = pagamento.metodo === "dinheiro";

  const enviar = async (evento) => {
    evento.preventDefault();
    if (codigo.length !== DIGITOS_DO_CODIGO) {
      setErro(`O código tem ${DIGITOS_DO_CODIGO} números. Peça ao cliente.`);
      return;
    }

    setEnviando(true);
    try {
      await confirmar(entrega.id, codigo);
    } catch (falha) {
      setErro(falha.campos?.codigo ?? falha.message);
      setCodigo("");
      setEnviando(false);
    }
  };

  return (
    <article className="entrega-cartao">
      <header className="entrega-cartao__topo">
        <span className="entrega-cartao__codigo">{entrega.id}</span>
        <span className="selo selo--quente">saiu às {hora(entrega.atualizadoEm)}</span>
      </header>

      <div className="entrega-cartao__bloco">
        <p className="entrega-cartao__rotulo">Entregar para</p>
        <p className="entrega-cartao__forte">{cliente.nome}</p>
        <p>
          {endereco}
          {destino.complemento ? ` (${destino.complemento})` : ""}
          <br />
          {destino.bairro}
        </p>
        <div className="entrega-cartao__atalhos">
          <a
            className="btn btn--linha btn--pequeno"
            href={rota}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir rota
            <IconeSeta width={15} height={15} />
          </a>
          <a
            className="btn btn--linha btn--pequeno"
            href={`tel:+55${soDigitos(cliente.telefone)}`}
          >
            Ligar {cliente.telefone}
          </a>
        </div>
      </div>

      <div className="entrega-cartao__bloco">
        <p className="entrega-cartao__rotulo">Levando</p>
        <ul className="entrega-cartao__itens">
          {itens.map((i) => (
            <li key={i.linhaId}>
              {i.quantidade}x {i.nome}
              <em>
                {i.tamanhoNome}
                {i.borda !== "sem" && i.bordaNome ? ` · ${i.bordaNome}` : ""}
              </em>
            </li>
          ))}
        </ul>
      </div>

      <div className="entrega-cartao__bloco">
        <p className="entrega-cartao__rotulo">Pagamento</p>
        {emDinheiro ? (
          <p>
            <span className="entrega-cartao__forte">
              Receber {moeda(total)} em dinheiro
            </span>
            {pagamento.troco && (
              <>
                <br />
                Cliente paga com {moeda(pagamento.troco)}: leve{" "}
                {moeda(pagamento.troco - total)} de troco
              </>
            )}
          </p>
        ) : (
          <p>
            Já pago pelo site ({pagamento.metodo === "pix" ? "Pix" : "cartão"}).
            Nada a receber.
          </p>
        )}
      </div>

      <form className="entrega-cartao__confirmar" onSubmit={enviar} noValidate>
        <label className="campo">
          <span className="campo__rotulo">
            Código que o cliente informa ao receber
          </span>
          <input
            className="campo__entrada entrega-cartao__codigo-entrada"
            value={codigo}
            inputMode="numeric"
            autoComplete="off"
            placeholder={"0".repeat(DIGITOS_DO_CODIGO)}
            aria-invalid={erro ? "true" : undefined}
            onChange={(e) => {
              setCodigo(soDigitos(e.target.value).slice(0, DIGITOS_DO_CODIGO));
              setErro("");
            }}
          />
          {erro && <span className="campo__erro">{erro}</span>}
        </label>
        <button
          type="submit"
          className="btn btn--ambar btn--bloco"
          disabled={enviando || !online}
        >
          {enviando ? "Confirmando..." : "Confirmar entrega"}
        </button>
        {!online && (
          <p className="campo__erro">
            Sem internet. A confirmação precisa de conexão.
          </p>
        )}
      </form>
    </article>
  );
}
