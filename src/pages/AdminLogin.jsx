import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconeCadeado, IconeVoltar } from "../components/Icones";

export default function AdminLogin() {
  const { entrar, autenticado, CREDENCIAIS } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  if (autenticado) return <Navigate to="/admin/painel" replace />;

  const enviar = (e) => {
    e.preventDefault();
    const r = entrar(usuario, senha);
    if (!r.ok) setErro(r.erro);
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
            onChange={(e) => {
              setSenha(e.target.value);
              setErro("");
            }}
          />
        </label>

        {erro && <p className="campo__erro">{erro}</p>}

        <button type="submit" className="btn btn--ambar btn--bloco">
          Entrar
        </button>

        <p className="login__dica">
          Login simulado. Use <code>{CREDENCIAIS.usuario}</code> e{" "}
          <code>{CREDENCIAIS.senha}</code>.
        </p>

        <Link to="/" className="btn btn--fantasma btn--pequeno">
          <IconeVoltar width={15} height={15} />
          Voltar para o site
        </Link>
      </form>
    </section>
  );
}
