import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ler, gravar, limpar } from "../lib/persistencia";
const CREDENCIAIS = { usuario: "admin", senha: "admin123" };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => ler("sessao", null));

  useEffect(() => {
    if (sessao) gravar("sessao", sessao);
    else limpar("sessao");
  }, [sessao]);

  const entrar = useCallback((usuario, senha) => {
    if (usuario.trim() === CREDENCIAIS.usuario && senha === CREDENCIAIS.senha) {
      setSessao({
        usuario: "admin",
        nome: "Gerência",
        entrouEm: new Date().toISOString(),
      });
      return { ok: true };
    }
    return { ok: false, erro: "Usuário ou senha não conferem." };
  }, []);

  const sair = useCallback(() => setSessao(null), []);

  const valor = useMemo(
    () => ({ sessao, autenticado: Boolean(sessao), entrar, sair, CREDENCIAIS }),
    [sessao, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
