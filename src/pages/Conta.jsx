import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { erroDeNome, erroDeTelefone } from "../../shared/validacao.js";
import Campo from "../components/Campo";
import { IconeSair } from "../components/Icones";
import { useAuth } from "../context/AuthContext";
import { useLoja } from "../context/LojaContext";
import { BAIRROS } from "../data/catalogo";
import {
  dataHora,
  etapaDoPedido,
  mascaraCep,
  mascaraTelefone,
  moeda,
  pedidoEmAberto,
  primeiroNome,
  soDigitos,
} from "../lib/format";

const formularioDe = (cliente) => ({
  nome: cliente.nome,
  telefone: cliente.telefone,
  cep: cliente.endereco?.cep ?? "",
  rua: cliente.endereco?.rua ?? "",
  numero: cliente.endereco?.numero ?? "",
  bairro: cliente.endereco?.bairro ?? "",
  complemento: cliente.endereco?.complemento ?? "",
});

export default function Conta() {
  const { cliente, atualizarPerfil, sairCliente } = useAuth();
  const { meusPedidos } = useLoja();

  const [dados, setDados] = useState(() => formularioDe(cliente));
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // A conta muda fora deste formulário também: um pedido novo grava o
  // endereço usado, por exemplo. Enquanto a pessoa não começa a digitar, o
  // formulário acompanha.
  useEffect(() => {
    if (!editando) setDados(formularioDe(cliente));
  }, [cliente, editando]);

  const definir = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setEditando(true);
    setSalvo(false);
    setErroGeral("");
  };

  const validar = () => {
    const e = {};
    const nome = erroDeNome(dados.nome);
    if (nome) e.nome = nome;
    const telefone = erroDeTelefone(dados.telefone);
    if (telefone) e.telefone = telefone;
    if (dados.cep && soDigitos(dados.cep).length !== 8) {
      e.cep = "O CEP tem 8 dígitos.";
    }
    return e;
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;

    setSalvando(true);
    try {
      const { nome, telefone, ...endereco } = dados;
      await atualizarPerfil({ nome, telefone, endereco });
      setEditando(false);
      setSalvo(true);
    } catch (erro) {
      // O servidor responde "endereco.cep"; o campo aqui se chama só "cep".
      const campos = Object.fromEntries(
        Object.entries(erro.campos ?? {}).map(([campo, mensagem]) => [
          campo.replace("endereco.", ""),
          mensagem,
        ]),
      );
      setErros(campos);
      setErroGeral(erro.campos ? "" : erro.message);
    } finally {
      setSalvando(false);
    }
  };

  const emAberto = meusPedidos.filter((p) => pedidoEmAberto(p.status)).length;

  return (
    <section className="pagina">
      <div className="wrap">
        <header className="pagina__cabecalho conta__topo">
          <div>
            <h1>Minha conta</h1>
            <p className="pagina__apoio">
              Olá, {primeiroNome(cliente.nome)}.{" "}
              {emAberto > 0
                ? `Você tem ${emAberto} ${emAberto === 1 ? "pedido" : "pedidos"} a caminho.`
                : "Seus dados e pedidos ficam aqui."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--linha btn--pequeno"
            onClick={sairCliente}
          >
            <IconeSair width={16} height={16} />
            Sair da conta
          </button>
        </header>

        <div className="conta">
          <section className="conta__coluna" aria-labelledby="conta-pedidos">
            <h2 id="conta-pedidos" className="conta__titulo">
              Meus pedidos
            </h2>

            {meusPedidos.length === 0 ? (
              <div className="nota">
                <p className="nota__titulo">Nenhum pedido ainda</p>
                <p>
                  Quando você pedir, o andamento aparece aqui e muda sozinho a
                  cada etapa.
                </p>
                <Link to="/cardapio" className="conta__atalho">
                  Ver o cardápio
                </Link>
              </div>
            ) : (
              <ul className="meus-pedidos">
                {meusPedidos.map((p) => (
                  <li key={p.id}>
                    <Link to={`/pedido/${p.id}`} className="meu-pedido">
                      <span className="meu-pedido__codigo">{p.id}</span>
                      <span className="meu-pedido__resumo">
                        <span>
                          {p.itens
                            .map((i) => `${i.quantidade}x ${i.nome}`)
                            .join(", ")}
                        </span>
                        <em>
                          {dataHora(p.criadoEm)} · {moeda(p.total)}
                        </em>
                      </span>
                      <span className={`selo ${etapaDoPedido(p).cor}`}>
                        {etapaDoPedido(p).nome}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="conta__coluna" onSubmit={salvar} noValidate>
            <h2 className="conta__titulo">Meus dados</h2>

            <fieldset className="bloco">
              <legend className="bloco__legenda">Contato</legend>
              <div className="malha">
                <Campo
                  rotulo="Nome completo"
                  valor={dados.nome}
                  erro={erros.nome}
                  aoMudar={(v) => definir("nome", v)}
                  autoComplete="name"
                  maxLength={80}
                  largo
                />
                <Campo
                  rotulo="Telefone com DDD"
                  valor={dados.telefone}
                  erro={erros.telefone}
                  aoMudar={(v) => definir("telefone", mascaraTelefone(v))}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <Campo
                  rotulo="E-mail da conta"
                  valor={cliente.email}
                  aoMudar={() => {}}
                  readOnly
                />
              </div>
            </fieldset>

            <fieldset className="bloco">
              <legend className="bloco__legenda">Endereço de entrega</legend>
              <div className="malha">
                <Campo
                  rotulo="CEP"
                  valor={dados.cep}
                  erro={erros.cep}
                  aoMudar={(v) => definir("cep", mascaraCep(v))}
                  placeholder="58400-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                <label className="campo">
                  <span className="campo__rotulo">Bairro</span>
                  <select
                    className="campo__entrada"
                    value={dados.bairro}
                    aria-invalid={erros.bairro ? "true" : undefined}
                    onChange={(e) => definir("bairro", e.target.value)}
                  >
                    <option value="">Escolha o bairro</option>
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
                  autoComplete="address-line1"
                  maxLength={120}
                  largo
                />
                <Campo
                  rotulo="Número"
                  valor={dados.numero}
                  erro={erros.numero}
                  aoMudar={(v) => definir("numero", v)}
                  inputMode="numeric"
                  maxLength={10}
                />
                <Campo
                  rotulo="Complemento (opcional)"
                  valor={dados.complemento}
                  erro={erros.complemento}
                  aoMudar={(v) => definir("complemento", v)}
                  maxLength={80}
                />
              </div>
            </fieldset>

            {erroGeral && (
              <p className="campo__erro" role="alert">
                {erroGeral}
              </p>
            )}

            <div className="conta__acoes">
              <button
                type="submit"
                className="btn btn--ambar"
                disabled={salvando || !editando}
              >
                {salvando ? "Salvando..." : "Salvar dados"}
              </button>
              {salvo && (
                <span className="campo__ok" role="status">
                  Dados atualizados.
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
