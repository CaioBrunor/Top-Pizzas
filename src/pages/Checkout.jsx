import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { erroDeNome } from "../../shared/validacao.js";
import Campo from "../components/Campo";
import { useAuth } from "../context/AuthContext";
import { useCarrinho } from "../context/CarrinhoContext";
import { useLoja } from "../context/LojaContext";
import { BAIRROS } from "../data/catalogo";
import {
  mascaraCartao,
  mascaraCep,
  mascaraTelefone,
  mascaraValidade,
  moeda,
  precoParaNumero,
  soDigitos,
} from "../lib/format";
import { useOnline } from "../lib/tempoReal";
import { IconeCheck, IconeSeta, IconeVoltar } from "../components/Icones";

const ETAPAS = ["Entrega", "Pagamento", "Revisão"];

// Onde fica, no formulário, cada campo que o servidor pode recusar.
const CAMPOS_DO_SERVIDOR = {
  "contato.nome": { campo: "nome", etapa: 0 },
  "contato.telefone": { campo: "telefone", etapa: 0 },
  "entrega.cep": { campo: "cep", etapa: 0 },
  "entrega.rua": { campo: "rua", etapa: 0 },
  "entrega.numero": { campo: "numero", etapa: 0 },
  "entrega.bairro": { campo: "bairro", etapa: 0 },
  "entrega.complemento": { campo: "complemento", etapa: 0 },
  "pagamento.troco": { campo: "troco", etapa: 1 },
};

export default function Checkout() {
  const {
    itens,
    subtotal,
    taxaEntrega,
    total,
    vazio,
    modoEntrega,
    setModoEntrega,
    esvaziar,
  } = useCarrinho();
  const { criarPedido, recarregarCatalogo } = useLoja();
  const { cliente } = useAuth();
  const online = useOnline();
  const navegar = useNavigate();

  const [etapa, setEtapa] = useState(0);
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [processando, setProcessando] = useState(false);

  // Começa com os dados atuais da conta: o endereço do último pedido.
  const [dados, setDados] = useState(() => ({
    nome: cliente.nome,
    telefone: cliente.telefone,
    cep: cliente.endereco?.cep ?? "",
    rua: cliente.endereco?.rua ?? "",
    numero: cliente.endereco?.numero ?? "",
    bairro: cliente.endereco?.bairro || BAIRROS[0],
    complemento: cliente.endereco?.complemento ?? "",
    metodo: "pix",
    cartaoNumero: "",
    cartaoNome: "",
    cartaoValidade: "",
    cartaoCvv: "",
    troco: "",
  }));

  const definir = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setErroEnvio("");
  };

  const validarEntrega = () => {
    const e = {};
    const nome = erroDeNome(dados.nome);
    if (nome) e.nome = nome;
    if (soDigitos(dados.telefone).length < 10)
      e.telefone = "Telefone incompleto.";
    if (modoEntrega === "entrega") {
      if (soDigitos(dados.cep).length !== 8) e.cep = "O CEP tem 8 dígitos.";
      if (dados.rua.trim().length < 3) e.rua = "Informe a rua.";
      if (!dados.numero.trim()) e.numero = "Informe o número.";
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const validarPagamento = () => {
    const e = {};
    if (dados.metodo === "cartao") {
      if (soDigitos(dados.cartaoNumero).length !== 16)
        e.cartaoNumero = "São 16 dígitos.";
      if (dados.cartaoNome.trim().length < 3)
        e.cartaoNome = "Nome impresso no cartão.";
      if (soDigitos(dados.cartaoValidade).length !== 4)
        e.cartaoValidade = "Use MM/AA.";
      if (soDigitos(dados.cartaoCvv).length < 3) e.cartaoCvv = "3 dígitos.";
    }
    if (dados.metodo === "dinheiro" && dados.troco) {
      const valor = Number(dados.troco.replace(",", "."));
      if (Number.isNaN(valor) || valor < total)
        e.troco = `Precisa ser pelo menos ${moeda(total)}.`;
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const avancar = () => {
    if (etapa === 0 && !validarEntrega()) return;
    if (etapa === 1 && !validarPagamento()) return;
    setEtapa((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const voltar = () => {
    setEtapa((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalizar = async () => {
    setProcessando(true);
    setErroEnvio("");

    try {
      // Vão só as escolhas do cliente. O nome e o preço de cada item são
      // montados pelo servidor a partir do cardápio dele.
      const pedido = await criarPedido({
        contato: { nome: dados.nome, telefone: dados.telefone },
        itens: itens.map(
          ({ produtoId, tamanho, borda, quantidade, observacao }) => ({
            produtoId,
            tamanho,
            borda,
            quantidade,
            observacao,
          }),
        ),
        entrega:
          modoEntrega === "retirada"
            ? { tipo: "retirada" }
            : {
                tipo: "entrega",
                cep: dados.cep,
                rua: dados.rua,
                numero: dados.numero,
                bairro: dados.bairro,
                complemento: dados.complemento,
              },
        pagamento: {
          metodo: dados.metodo,
          troco:
            dados.metodo === "dinheiro" && dados.troco
              ? precoParaNumero(dados.troco)
              : null,
        },
        totalEsperado: total,
      });

      esvaziar();
      navegar(`/pedido/${pedido.id}`, { replace: true });
    } catch (erro) {
      setProcessando(false);

      const recusados = Object.entries(erro.campos ?? {})
        .map(([chave, mensagem]) => ({ ...CAMPOS_DO_SERVIDOR[chave], mensagem }))
        .filter((r) => r.campo);
      if (recusados.length > 0) {
        setErros(
          Object.fromEntries(recusados.map((r) => [r.campo, r.mensagem])),
        );
        setEtapa(Math.min(...recusados.map((r) => r.etapa)));
        return;
      }

      setErroEnvio(erro.message);
      // O carrinho se ajusta sozinho quando o cardápio novo chega.
      if (erro.codigo === "CARDAPIO_ALTERADO") recarregarCatalogo();
    }
  };

  const resumo = useMemo(
    () => (
      <aside className="resumo-caixa">
        <h2 className="resumo-caixa__titulo">Resumo</h2>
        <ul className="resumo-caixa__itens">
          {itens.map((i) => (
            <li key={i.linhaId}>
              <span>
                {i.quantidade}x {i.nome}
                <em>
                  {i.tamanhoNome}
                  {i.borda !== "sem" && i.bordaNome ? ` · ${i.bordaNome}` : ""}
                </em>
              </span>
              <strong>{moeda(i.precoUnitario * i.quantidade)}</strong>
            </li>
          ))}
        </ul>
        <dl className="resumo">
          <div className="resumo__linha">
            <dt>Subtotal</dt>
            <dd>{moeda(subtotal)}</dd>
          </div>
          <div className="resumo__linha">
            <dt>{modoEntrega === "retirada" ? "Retirada" : "Entrega"}</dt>
            <dd>{taxaEntrega === 0 ? "Grátis" : moeda(taxaEntrega)}</dd>
          </div>
          <div className="resumo__linha resumo__linha--total">
            <dt>Total</dt>
            <dd>{moeda(total)}</dd>
          </div>
        </dl>
      </aside>
    ),
    [itens, subtotal, taxaEntrega, total, modoEntrega],
  );

  if (vazio && !processando) return <Navigate to="/cardapio" replace />;

  return (
    <section className="pagina">
      <div className="wrap">
        <header className="pagina__cabecalho">
          <h1>Fechar pedido</h1>
          <ol className="trilha">
            {ETAPAS.map((nome, i) => (
              <li
                key={nome}
                className={`trilha__item ${i === etapa ? "trilha__item--atual" : ""} ${
                  i < etapa ? "trilha__item--feito" : ""
                }`}
              >
                <span className="trilha__marca">
                  {i < etapa ? <IconeCheck width={14} height={14} /> : i + 1}
                </span>
                {nome}
              </li>
            ))}
          </ol>
        </header>

        <div className="checkout">
          <div className="checkout__painel">
            {etapa === 0 && (
              <div className="stack-lg">
                <div
                  className="alternador alternador--largo"
                  role="group"
                  aria-label="Recebimento"
                >
                  <button
                    type="button"
                    className={
                      modoEntrega === "entrega" ? "alternador--ativo" : ""
                    }
                    onClick={() => setModoEntrega("entrega")}
                  >
                    Entrega em casa
                  </button>
                  <button
                    type="button"
                    className={
                      modoEntrega === "retirada" ? "alternador--ativo" : ""
                    }
                    onClick={() => setModoEntrega("retirada")}
                  >
                    Retirar na loja
                  </button>
                </div>

                <fieldset className="bloco">
                  <legend className="bloco__legenda">Quem está pedindo</legend>
                  <div className="malha">
                    <Campo
                      rotulo="Nome completo"
                      valor={dados.nome}
                      erro={erros.nome}
                      aoMudar={(v) => definir("nome", v)}
                      placeholder="Caio Bruno"
                      autoComplete="name"
                    />
                    <Campo
                      rotulo="Telefone com DDD"
                      valor={dados.telefone}
                      erro={erros.telefone}
                      aoMudar={(v) => definir("telefone", mascaraTelefone(v))}
                      placeholder="(83) 99999-0000"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <Campo
                      rotulo="E-mail da conta"
                      valor={cliente.email}
                      aoMudar={() => {}}
                      readOnly
                      largo
                    />
                  </div>
                </fieldset>

                {modoEntrega === "entrega" ? (
                  <fieldset className="bloco">
                    <legend className="bloco__legenda">Para onde vai</legend>
                    <div className="malha">
                      <Campo
                        rotulo="CEP"
                        valor={dados.cep}
                        erro={erros.cep}
                        aoMudar={(v) => definir("cep", mascaraCep(v))}
                        placeholder="58400-000"
                        inputMode="numeric"
                      />
                      <label className="campo">
                        <span className="campo__rotulo">Bairro</span>
                        <select
                          className="campo__entrada"
                          value={dados.bairro}
                          onChange={(e) => definir("bairro", e.target.value)}
                        >
                          {BAIRROS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        {erros.bairro && (
                          <span className="campo__erro">{erros.bairro}</span>
                        )}
                      </label>
                      <Campo
                        rotulo="Rua"
                        valor={dados.rua}
                        erro={erros.rua}
                        aoMudar={(v) => definir("rua", v)}
                        placeholder="Rua 1 "
                        maxLength={120}
                        largo
                      />
                      <Campo
                        rotulo="Número"
                        valor={dados.numero}
                        erro={erros.numero}
                        aoMudar={(v) => definir("numero", v)}
                        placeholder="412"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      <Campo
                        rotulo="Complemento (opcional)"
                        valor={dados.complemento}
                        erro={erros.complemento}
                        aoMudar={(v) => definir("complemento", v)}
                        placeholder="Apto 302, portão verde"
                        maxLength={80}
                      />
                    </div>
                  </fieldset>
                ) : (
                  <div className="nota">
                    <p className="nota__titulo">Retirada no balcão</p>
                    <p>
                      Rua 1, 333 — Alto Branco. Avisamos no WhatsApp quando a
                      pizza sair do forno. Guardamos por 1 hora.
                    </p>
                  </div>
                )}
              </div>
            )}

            {etapa === 1 && (
              <div className="stack-lg">
                <div className="nota nota--atencao">
                  <p className="nota__titulo">Pagamento simulado</p>
                  <p>Nenhum dado de cartão sai do navegador nem é guardado.</p>
                </div>

                <fieldset className="bloco">
                  <legend className="bloco__legenda">Forma de pagamento</legend>
                  <div className="opcoes__linha">
                    {[
                      { id: "pix", nome: "Pix", detalhe: "Confirma na hora" },
                      {
                        id: "cartao",
                        nome: "Cartão de crédito",
                        detalhe: "Até 2x sem juros",
                      },
                      {
                        id: "dinheiro",
                        nome: "Dinheiro na entrega",
                        detalhe: "Levamos troco",
                      },
                    ].map((m) => (
                      <label
                        key={m.id}
                        className={`opcao ${dados.metodo === m.id ? "opcao--ativa" : ""}`}
                      >
                        <input
                          type="radio"
                          name="metodo"
                          className="sr-only"
                          checked={dados.metodo === m.id}
                          onChange={() => definir("metodo", m.id)}
                        />
                        <span className="opcao__nome">{m.nome}</span>
                        <span className="opcao__detalhe">{m.detalhe}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {dados.metodo === "pix" && (
                  <div className="pix">
                    <div className="pix__codigo" aria-hidden="true">
                      <QrFalso />
                    </div>
                    <div>
                      <p className="pix__titulo">Código copia e cola</p>
                      <code className="pix__chave">
                        00020126BR.GOV.BCB.PIX.TOPPIZZAS.CG.5204
                        {Math.round(total * 100)}
                      </code>
                      <p className="pix__nota">O código acima é ilustrativo.</p>
                    </div>
                  </div>
                )}

                {dados.metodo === "cartao" && (
                  <fieldset className="bloco">
                    <legend className="bloco__legenda">Dados do cartão</legend>
                    <div className="malha">
                      <Campo
                        rotulo="Número do cartão"
                        valor={dados.cartaoNumero}
                        erro={erros.cartaoNumero}
                        aoMudar={(v) =>
                          definir("cartaoNumero", mascaraCartao(v))
                        }
                        placeholder="4111 1111 1111 1111"
                        inputMode="numeric"
                        largo
                      />
                      <Campo
                        rotulo="Nome impresso"
                        valor={dados.cartaoNome}
                        erro={erros.cartaoNome}
                        aoMudar={(v) => definir("cartaoNome", v.toUpperCase())}
                        placeholder="CAIO B SILVA"
                        largo
                      />
                      <Campo
                        rotulo="Validade"
                        valor={dados.cartaoValidade}
                        erro={erros.cartaoValidade}
                        aoMudar={(v) =>
                          definir("cartaoValidade", mascaraValidade(v))
                        }
                        placeholder="09/29"
                        inputMode="numeric"
                      />
                      <Campo
                        rotulo="CVV"
                        valor={dados.cartaoCvv}
                        erro={erros.cartaoCvv}
                        aoMudar={(v) =>
                          definir("cartaoCvv", soDigitos(v).slice(0, 4))
                        }
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>
                  </fieldset>
                )}

                {dados.metodo === "dinheiro" && (
                  <fieldset className="bloco">
                    <legend className="bloco__legenda">Troco</legend>
                    <div className="malha">
                      <Campo
                        rotulo={`Precisa de troco para quanto? Total ${moeda(total)}`}
                        valor={dados.troco}
                        erro={erros.troco}
                        aoMudar={(v) => definir("troco", v)}
                        placeholder="100,00"
                        inputMode="decimal"
                        largo
                      />
                    </div>
                  </fieldset>
                )}
              </div>
            )}

            {etapa === 2 && (
              <div className="stack-lg">
                <div className="bloco">
                  <p className="bloco__legenda">
                    Confira antes de mandar para a cozinha
                  </p>
                  <dl className="revisao">
                    <div>
                      <dt>Nome</dt>
                      <dd>{dados.nome}</dd>
                    </div>
                    <div>
                      <dt>Telefone</dt>
                      <dd>{dados.telefone}</dd>
                    </div>
                    <div>
                      <dt>
                        {modoEntrega === "retirada" ? "Retirada" : "Endereco"}
                      </dt>
                      <dd>
                        {modoEntrega === "retirada"
                          ? "Rua 1, 333 - Alto Branco"
                          : `${dados.rua}, ${dados.numero}${
                              dados.complemento ? ` — ${dados.complemento}` : ""
                            } — ${dados.bairro}`}
                      </dd>
                    </div>
                    <div>
                      <dt>Pagamento</dt>
                      <dd>
                        {dados.metodo === "pix" && "Pix"}
                        {dados.metodo === "cartao" &&
                          `Cartão final ${soDigitos(dados.cartaoNumero).slice(-4)}`}
                        {dados.metodo === "dinheiro" &&
                          `Dinheiro${dados.troco ? `, troco para R$ ${dados.troco}` : ""}`}
                      </dd>
                    </div>
                  </dl>
                </div>

                {!online && (
                  <div className="nota nota--atencao" role="status">
                    <p className="nota__titulo">Você está sem internet</p>
                    <p>
                      O carrinho e estes dados ficam guardados. Confirme o
                      pedido quando a conexão voltar.
                    </p>
                  </div>
                )}

                {erroEnvio && (
                  <div className="nota nota--atencao" role="alert">
                    <p className="nota__titulo">O pedido não foi enviado</p>
                    <p>{erroEnvio}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--ambar btn--bloco"
                  onClick={finalizar}
                  disabled={processando || !online}
                >
                  {processando
                    ? "Enviando pedido..."
                    : `Confirmar pedido ${moeda(total)}`}
                </button>
              </div>
            )}

            <div className="checkout__navegacao">
              {etapa > 0 ? (
                <button
                  type="button"
                  className="btn btn--fantasma"
                  onClick={voltar}
                >
                  <IconeVoltar width={16} height={16} />
                  Voltar
                </button>
              ) : (
                <Link to="/cardapio" className="btn btn--fantasma">
                  <IconeVoltar width={16} height={16} />
                  Continuar comprando
                </Link>
              )}

              {etapa < 2 && (
                <button
                  type="button"
                  className="btn btn--ambar"
                  onClick={avancar}
                >
                  Continuar
                  <IconeSeta width={16} height={16} />
                </button>
              )}
            </div>
          </div>

          {resumo}
        </div>
      </div>
    </section>
  );
}

function QrFalso() {
  const celulas = [];
  for (let y = 0; y < 13; y += 1) {
    for (let x = 0; x < 13; x += 1) {
      const cheio = (x * 7 + y * 5 + ((x * y) % 6)) % 3 !== 0;
      const cantos = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      if (cheio && !cantos) {
        celulas.push(
          <rect key={`${x}-${y}`} x={x * 8} y={y * 8} width="7" height="7" />,
        );
      }
    }
  }
  return (
    <svg viewBox="0 0 104 104" width="104" height="104" fill="currentColor">
      {celulas}
      {[
        [0, 0],
        [72, 0],
        [0, 72],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="31" height="31" />
          <rect
            x={x + 6}
            y={y + 6}
            width="19"
            height="19"
            fill="var(--surface)"
          />
          <rect x={x + 11} y={y + 11} width="9" height="9" />
        </g>
      ))}
    </svg>
  );
}
