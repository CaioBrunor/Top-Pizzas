import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { api } from "../lib/api";
import { limpar } from "../lib/persistencia";
import {
  aoMudarSessao,
  gravarSessao,
  lerSessao,
  limparSessao,
} from "../lib/sessao";

const AuthContext = createContext(null);

const useSessao = (escopo) =>
  useSyncExternalStore(aoMudarSessao, () => lerSessao(escopo));

async function abrirSessao(escopo, caminho, corpo) {
  const { token, usuario } = await api(caminho, { metodo: "POST", corpo });
  gravarSessao(escopo, { token, usuario });
  return usuario;
}

function trocarUsuario(escopo, usuario) {
  const sessao = lerSessao(escopo);
  if (sessao) gravarSessao(escopo, { ...sessao, usuario });
}

export function AuthProvider({ children }) {
  const sessaoCliente = useSessao("cliente");
  const sessaoAdmin = useSessao("admin");
  const sessaoEntregador = useSessao("entregador");

  // As sessões guardadas no navegador são conferidas com o servidor ao abrir
  // o site. Token vencido encerra a sessão (a api cuida disso). Sem internet,
  // vale o que está salvo, para o app abrir offline.
  useEffect(() => {
    for (const escopo of ["cliente", "admin", "entregador"]) {
      const salva = lerSessao(escopo);
      if (!salva) continue;
      api("/auth/eu", { escopo })
        .then(({ usuario }) => {
          if (lerSessao(escopo)?.token === salva.token) {
            trocarUsuario(escopo, usuario);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Sem sessão, os dados pessoais guardados para o modo offline saem do
  // navegador. Vale para sair, para sessão vencida e para sair em outra aba.
  useEffect(() => {
    if (!sessaoCliente) limpar("meusPedidos");
  }, [sessaoCliente]);
  useEffect(() => {
    if (!sessaoAdmin) limpar("painel");
  }, [sessaoAdmin]);
  useEffect(() => {
    if (!sessaoEntregador) limpar("minhasEntregas");
  }, [sessaoEntregador]);

  const entrarCliente = useCallback(
    (email, senha) => abrirSessao("cliente", "/auth/entrar", { email, senha }),
    [],
  );

  const cadastrar = useCallback(
    (dados) => abrirSessao("cliente", "/auth/cadastrar", dados),
    [],
  );

  const atualizarPerfil = useCallback(async (dados) => {
    const { usuario } = await api("/auth/eu", {
      metodo: "PUT",
      corpo: dados,
      escopo: "cliente",
    });
    trocarUsuario("cliente", usuario);
    return usuario;
  }, []);

  const atualizarCliente = useCallback(
    (usuario) => trocarUsuario("cliente", usuario),
    [],
  );

  const sairCliente = useCallback(() => limparSessao("cliente"), []);

  const entrar = useCallback(
    (usuario, senha) =>
      abrirSessao("admin", "/auth/admin/entrar", { usuario, senha }),
    [],
  );

  const sair = useCallback(() => limparSessao("admin"), []);

  const entrarEntregador = useCallback(
    (telefone, senha) =>
      abrirSessao("entregador", "/auth/entregador/entrar", { telefone, senha }),
    [],
  );

  const sairEntregador = useCallback(() => limparSessao("entregador"), []);

  const valor = useMemo(
    () => ({
      // área do cliente
      cliente: sessaoCliente?.usuario ?? null,
      clienteAutenticado: Boolean(sessaoCliente),
      entrarCliente,
      cadastrar,
      atualizarPerfil,
      atualizarCliente,
      sairCliente,
      // painel administrativo
      sessao: sessaoAdmin?.usuario ?? null,
      autenticado: Boolean(sessaoAdmin),
      entrar,
      sair,
      // área do entregador
      entregador: sessaoEntregador?.usuario ?? null,
      entrarEntregador,
      sairEntregador,
    }),
    [
      sessaoCliente,
      sessaoAdmin,
      sessaoEntregador,
      entrarCliente,
      cadastrar,
      atualizarPerfil,
      atualizarCliente,
      sairCliente,
      entrar,
      sair,
      entrarEntregador,
      sairEntregador,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
