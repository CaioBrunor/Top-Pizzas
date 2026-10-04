import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { IconeMoto, IconeVoltar } from "../../components/Icones";
import { useAuth } from "../../context/AuthContext";
import { mascaraTelefone, soDigitos } from "../../lib/format";

export default function EntregadorLogin() {
  const { entregador, entrarEntregador } = useAuth();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (entregador) return <Navigate to="/entregador/entregas" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    if (soDigitos(telefone).length < 10 || !senha) {
      setErro("Informe o telefone com DDD e a senha.");
      return;
    }

    setEnviando(true);
    try {
      await entrarEntregador(telefone, senha);
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  };

  return (
    <section className="login">
      <form className="login__caixa" onSubmit={enviar}>
        <span className="login__icone">
          <IconeMoto width={22} height={22} />
        </span>
        <h1 className="login__titulo">Área do entregador</h1>
        <p className="login__apoio">
          Entre com o telefone e a senha que a loja cadastrou para você.
        </p>

        <label className="campo">
          <span className="campo__rotulo">Telefone com DDD</span>
          <input
            className="campo__entrada"
            value={telefone}
            inputMode="tel"
            autoComplete="username"
            placeholder="(83) 99999-0000"
            onChange={(e) => {
              setTelefone(mascaraTelefone(e.target.value));
              setErro("");
            }}
          />
        </label>

        <label className="campo">
          <span className="campo__rotulo">Senha</span>
          <input
            type="password"
            className="campo__entrada"
            value={senha}
            autoComplete="current-password"
            maxLength={200}
            onChange={(e) => {
              setSenha(e.target.value);
              setErro("");
            }}
          />
        </label>

        {erro && (
          <p className="campo__erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--ambar btn--bloco"
          disabled={enviando}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <Link to="/" className="btn btn--fantasma btn--pequeno">
          <IconeVoltar width={15} height={15} />
          Voltar para o site
        </Link>
      </form>
    </section>
  );
}
