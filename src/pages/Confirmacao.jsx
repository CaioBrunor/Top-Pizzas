import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { distanciaEmMetros } from "../../shared/geo.js";
import Mapa from "../components/Mapa";
import { useLoja } from "../context/LojaContext";
import { COORDENADAS_DOS_BAIRROS, LOJA } from "../data/catalogo";
import {
  FLUXO_STATUS,
  dataHora,
  ehEntrega,
  etapaDoPedido,
  haQuantoTempo,
  hora,
  moeda,
  pedidoEmAberto,
  primeiroNome,
} from "../lib/format";
import { useAgora } from "../lib/relogio";
import { IconeCheck, IconeSeta } from "../components/Icones";

const NOMES_PAGAMENTO = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  dinheiro: "Dinheiro na entrega",
};

// Posição mais velha que isto não é confiável: o entregador pode ter fechado
// o app ou ficado sem sinal.
const POSICAO_VELHA = 3 * 60_000;
const RAIO_DO_BAIRRO = 700;

// Hora em que o pedido chegou a cada etapa. Se ele foi reaberto, vale só o
// que aconteceu desde a reabertura.
function horariosDasEtapas(historico = []) {
  const inicio = historico.map((h) => h.status).lastIndexOf("recebido");
  return Object.fromEntries(
    historico.slice(Math.max(inicio, 0)).map((h) => [h.status, h.em]),
  );
}

const emKm = (metros) =>
  metros < 950
    ? `${Math.round(metros / 50) * 50} m`
    : `${(metros / 1000).toFixed(1).replace(".", ",")} km`;

export default function Confirmacao() {
  const { id } = useParams();
  const { meusPedidos, buscarPedido } = useLoja();
  const pedido = meusPedidos.find((p) => p.id === id);
  const [falha, setFalha] = useState(null);

  // Quem chega por um link ou recarrega a página pode ainda não ter o pedido
  // na lista. Depois disso, cada mudança de status chega sozinha pelo tempo
  // real: é a cozinha, no painel, que move o pedido.
  useEffect(() => {
    if (pedido) return undefined;
    let ativo = true;
    setFalha(null);
    buscarPedido(id).catch((erro) => {
      if (ativo) setFalha(erro.semConexao ? "sem-conexao" : "nao-encontrado");
    });
    return () => {
      ativo = false;
    };
  }, [id, pedido, buscarPedido]);

  if (!pedido) {
    return (
      <section className="pagina">
        <div className="wrap vazio-pagina">
          {falha === "nao-encontrado" && (
            <>
              <h1>Pedido não encontrado</h1>
              <p>Esse código não existe na sua conta.</p>
            </>
          )}
          {falha === "sem-conexao" && (
            <>
              <h1>Sem conexão</h1>
              <p>
                Não deu para buscar este pedido agora. Ele aparece assim que a
                internet voltar.
              </p>
            </>
          )}
          {!falha && <p>Buscando o pedido...</p>}
          {falha && (
            <Link to="/conta" className="btn btn--ambar">
              Ver meus pedidos
            </Link>
          )}
        </div>
      </section>
    );
  }

  const indiceAtual = FLUXO_STATUS.indexOf(pedido.status);
  const cancelado = pedido.status === "cancelado";
  const horarios = horariosDasEtapas(pedido.historico);
  const emCasa = ehEntrega(pedido);

  return (
    <section className="pagina">
      <div className="wrap confirmacao">
        <header className="confirmacao__topo">
          <span className="confirmacao__selo">
            <IconeCheck width={22} height={22} />
          </span>
          <div>
            <h1>Pedido confirmado</h1>
            <p className="confirmacao__codigo">
              Código {pedido.id} · feito em {dataHora(pedido.criadoEm)}
            </p>
          </div>
        </header>

        {cancelado ? (
          <div className="nota nota--atencao">
            <p className="nota__titulo">Pedido cancelado</p>
            <p>Fale com a loja no (83) 3333-0110 se isso não foi você.</p>
          </div>
        ) : (
          <ol className="rastreio" aria-live="polite">
            {FLUXO_STATUS.map((s, i) => {
              const feito = i <= indiceAtual;
              return (
                <li
                  key={s}
                  className={`rastreio__etapa ${feito ? "rastreio__etapa--feita" : ""} ${
                    i === indiceAtual ? "rastreio__etapa--atual" : ""
                  }`}
                >
                  <span className="rastreio__ponto" />
                  <span className="rastreio__nome">
                    {etapaDoPedido(pedido, s).nome}
                  </span>
                  {feito && horarios[s] && (
                    <span className="rastreio__hora">{hora(horarios[s])}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {emCasa && pedidoEmAberto(pedido.status) && (
          <EntregaAoVivo pedido={pedido} />
        )}

        <div className="confirmacao__grade">
          <div className="bloco">
            <p className="bloco__legenda">O que vem</p>
            <ul className="resumo-caixa__itens">
              {pedido.itens.map((i) => (
                <li key={i.linhaId}>
                  <span>
                    {i.quantidade}x {i.nome}
                    <em>
                      {i.tamanhoNome}
                      {i.borda !== "sem" && i.bordaNome
                        ? ` · ${i.bordaNome}`
                        : ""}
                      {i.observacao ? ` · ${i.observacao}` : ""}
                    </em>
                  </span>
                  <strong>{moeda(i.precoUnitario * i.quantidade)}</strong>
                </li>
              ))}
            </ul>
            <dl className="resumo">
              <div className="resumo__linha">
                <dt>Subtotal</dt>
                <dd>{moeda(pedido.subtotal)}</dd>
              </div>
              <div className="resumo__linha">
                <dt>{emCasa ? "Entrega" : "Retirada"}</dt>
                <dd>
                  {pedido.taxaEntrega === 0
                    ? "Grátis"
                    : moeda(pedido.taxaEntrega)}
                </dd>
              </div>
              <div className="resumo__linha resumo__linha--total">
                <dt>Total</dt>
                <dd>{moeda(pedido.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="bloco">
            <p className="bloco__legenda">Para onde vai</p>
            <dl className="revisao">
              <div>
                <dt>Cliente</dt>
                <dd>
                  {pedido.cliente.nome}
                  <br />
                  {pedido.cliente.telefone}
                </dd>
              </div>
              <div>
                <dt>{emCasa ? "Endereço" : "Retirada"}</dt>
                <dd>
                  {emCasa
                    ? `${pedido.entrega.rua}, ${pedido.entrega.numero} — ${pedido.entrega.bairro}`
                    : "Rua 1, 333 — Alto Branco"}
                </dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{NOMES_PAGAMENTO[pedido.pagamento.metodo]}</dd>
              </div>
              {pedido.status === "entregue" && pedido.entregador && (
                <div>
                  <dt>Entrega</dt>
                  <dd>
                    Feita por {pedido.entregador.nome}
                    {pedido.confirmacao && (
                      <>
                        <br />
                        {pedido.confirmacao.tipo === "codigo"
                          ? "Confirmada com o seu código"
                          : "Confirmada pela loja"}{" "}
                        às {hora(pedido.confirmacao.em)}
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="confirmacao__acoes">
          <Link to="/cardapio" className="btn btn--linha">
            Pedir mais alguma coisa
          </Link>
          <Link to="/conta" className="btn btn--fantasma">
            Ver meus pedidos
            <IconeSeta width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Quem está levando, onde ele está e o código que fecha a entrega.
function EntregaAoVivo({ pedido }) {
  const { entregador, rastreio, codigoEntrega } = pedido;
  const naRua = pedido.status === "entrega" && Boolean(entregador);
  const agora = useAgora();

  const destino = COORDENADAS_DOS_BAIRROS[pedido.entrega.bairro] ?? null;
  const posicaoAtual =
    naRua && rastreio && agora - new Date(rastreio.em).getTime() < POSICAO_VELHA
      ? rastreio
      : null;

  const pontos = useMemo(
    () => [
      { id: "loja", tipo: "loja", lat: LOJA.lat, lng: LOJA.lng, rotulo: "Loja" },
      ...(posicaoAtual
        ? [
            {
              id: "entregador",
              tipo: "entregador",
              lat: posicaoAtual.lat,
              lng: posicaoAtual.lng,
              rotulo: primeiroNome(entregador.nome),
            },
          ]
        : []),
    ],
    [posicaoAtual, entregador],
  );

  // O endereço exato não vira coordenada: o mapa marca a região do bairro.
  const area = useMemo(
    () =>
      destino && {
        ...destino,
        raio: RAIO_DO_BAIRRO,
        rotulo: pedido.entrega.bairro,
      },
    [destino, pedido.entrega.bairro],
  );

  let situacao =
    "Quando o pedido sair, você vê aqui quem está levando e por onde ele anda.";
  if (naRua && posicaoAtual) {
    const falta = destino ? distanciaEmMetros(posicaoAtual, destino) : null;
    const onde =
      falta === null
        ? "A caminho."
        : falta <= RAIO_DO_BAIRRO
          ? `Já está no ${pedido.entrega.bairro}.`
          : `A cerca de ${emKm(falta)} do ${pedido.entrega.bairro}.`;
    situacao = `${onde} Posição de ${haQuantoTempo(posicaoAtual.em, agora)}.`;
  } else if (naRua) {
    situacao =
      "A caminho. A posição aparece no mapa quando o entregador estiver com o app aberto.";
  }

  return (
    <section
      className={`entrega-viva ${naRua ? "entrega-viva--com-mapa" : ""}`}
      aria-label="Acompanhamento da entrega"
    >
      <div className="bloco entrega-viva__dados">
        <p className="bloco__legenda">Sua entrega</p>

        {naRua && (
          <div className="entregador">
            <span className="entregador__inicial" aria-hidden="true">
              {entregador.nome.charAt(0)}
            </span>
            <div>
              <strong>{entregador.nome}</strong>
              <span>
                {[entregador.veiculo, entregador.placa]
                  .filter(Boolean)
                  .join(" · ") || "Entregador da casa"}
              </span>
            </div>
          </div>
        )}

        <p className="entrega-viva__situacao" aria-live="polite">
          {situacao}
        </p>

        {codigoEntrega && (
          <div className="codigo-entrega">
            <p className="codigo-entrega__rotulo">Código de entrega</p>
            <p className="codigo-entrega__numero">{codigoEntrega}</p>
            <p className="codigo-entrega__ajuda">
              Só você vê este código. Diga ao entregador na hora de receber: é
              assim que a entrega é confirmada.
            </p>
          </div>
        )}
      </div>

      {naRua && <Mapa pontos={pontos} area={area} rotulo="Mapa da entrega" />}
    </section>
  );
}
