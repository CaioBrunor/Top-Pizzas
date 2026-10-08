import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  erroDeEmail,
  erroDeNome,
  erroDeSenha,
  erroDeTelefone,
} from "../../shared/validacao.js";
import Campo from "../components/Campo";
import { IconePessoa } from "../components/Icones";
import { useAuth } from "../context/AuthContext";
import { mascaraTelefone } from "../lib/format";

// Só caminhos do próprio site: o "voltar" nunca leva para outro endereço.
const destinoSeguro = (voltar) =>
  typeof voltar === "string" && /^\/(?![/\\])/.test(voltar) ? voltar : "/conta";

const VAZIO = { nome: "", email: "", telefone: "", senha: "", confirmacao: "" };

export default function Entrar() {
  const { clienteAutenticado, entrarCliente, cadastrar } = useAuth();
  const { state } = useLocation();

  const [modo, setModo] = useState("entrar");
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Vale para quem já chegou logado e para quem acabou de entrar.
  if (clienteAutenticado) {
    return <Navigate to={destinoSeguro(state?.voltar)} replace />;
  }

  const criando = modo === "cadastrar";

  const definir = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setErroGeral("");
  };

  const trocarModo = (novo) => {
    setModo(novo);
    setErros({});
    setErroGeral("");
  };

  const validar = () => {
    const e = {};
    const email = erroDeEmail(dados.email);
    if (email) e.email = email;

    if (!criando) {
      if (!dados.senha) e.senha = "Informe a senha.";
      return e;
    }

    const nome = erroDeNome(dados.nome);
    if (nome) e.nome = nome;
    const telefone = erroDeTelefone(dados.telefone);
    if (telefone) e.telefone = telefone;
    const senha = erroDeSenha(dados.senha);
    if (senha) e.senha = senha;
    else if (dados.senha.toLowerCase() === dados.email.trim().toLowerCase()) {
      e.senha = "A senha não pode ser igual ao e-mail.";
    }
    if (dados.confirmacao !== dados.senha) {
      e.confirmacao = "As senhas não são iguais.";
    }
    return e;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const e = validar();
    setErros(e);
    setErroGeral("");
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      if (criando) {
        const { nome, email, telefone, senha } = dados;
        await cadastrar({ nome, email, telefone, senha });
      } else {
        await entrarCliente(dados.email, dados.senha);
      }
    } catch (erro) {
      setErros(erro.campos ?? {});
      setErroGeral(erro.campos ? "" : erro.message);
      setEnviando(false);
    }
  };

  return (
    <section className="login login--site">
      <form className="login__caixa" onSubmit={enviar} noValidate>
        <span className="login__icone">
          <IconePessoa width={22} height={22} />
        </span>
        <h1 className="login__titulo">
          {criando ? "Criar conta" : "Entrar na conta"}
        </h1>
        <p className="login__apoio">
          {state?.voltar === "/checkout"
            ? "Entre ou crie sua conta para fechar o pedido. O carrinho continua guardado."
            : "Com a conta você acompanha cada pedido em tempo real."}
        </p>

        <div
          className="alternador"
          role="group"
          aria-label="Entrar ou criar conta"
        >
          <button
            type="button"
            className={criando ? "" : "alternador--ativo"}
            onClick={() => trocarModo("entrar")}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            className={criando ? "alternador--ativo" : ""}
            onClick={() => trocarModo("cadastrar")}
          >
            Criar conta
          </button>
        </div>

        {criando && (
          <Campo
            rotulo="Nome completo"
            valor={dados.nome}
            erro={erros.nome}
            aoMudar={(v) => definir("nome", v)}
            autoComplete="name"
            maxLength={80}
          />
        )}

        <Campo
          rotulo="E-mail"
          valor={dados.email}
          erro={erros.email}
          aoMudar={(v) => definir("email", v)}
          type="email"
          inputMode="email"
          autoComplete={criando ? "email" : "username"}
          maxLength={254}
        />

        {criando && (
          <Campo
            rotulo="Telefone com DDD"
            valor={dados.telefone}
            erro={erros.telefone}
            aoMudar={(v) => definir("telefone", mascaraTelefone(v))}
            placeholder="(83) 99999-0000"
            inputMode="tel"
            autoComplete="tel"
          />
        )}

        <Campo
          rotulo="Senha"
          valor={dados.senha}
          erro={erros.senha}
          aoMudar={(v) => definir("senha", v)}
          type="password"
          autoComplete={criando ? "new-password" : "current-password"}
          maxLength={72}
        />

        {criando && (
          <>
            <Campo
              rotulo="Repita a senha"
              valor={dados.confirmacao}
              erro={erros.confirmacao}
              aoMudar={(v) => definir("confirmacao", v)}
              type="password"
              autoComplete="new-password"
              maxLength={72}
            />
            <p className="login__dica">
              Pelo menos 8 caracteres, com letras e números.
            </p>
          </>
        )}

        {erroGeral && (
          <p className="campo__erro" role="alert">
            {erroGeral}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--ambar btn--bloco"
          disabled={enviando}
        >
          {enviando ? "Aguarde..." : criando ? "Criar conta" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
