import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconeCadeado, IconeVoltar } from "../components/Icones";

export default function AdminLogin() {
  const { entrar, autenticado } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/admin/painel" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro("Informe o usuário e a senha.");
      return;
    }

    setEnviando(true);
    try {
      await entrar(usuario, senha);
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  };

  return (
    <section className="login">
      <form className="login__caixa" onSubmit={enviar}>
        <span className="login__icone">
          <IconeCadeado width={22} height={22} />
        </span>
        <h1 className="login__titulo">Painel administrativo</h1>
        <p className="login__apoio">Acesso da equipe da loja.</p>

        <label className="campo">
          <span className="campo__rotulo">Usuário</span>
          <input
            className="campo__entrada"
            value={usuario}
            autoComplete="username"
            autoCapitalize="none"
            maxLength={60}
            onChange={(e) => {
              setUsuario(e.target.value);
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
