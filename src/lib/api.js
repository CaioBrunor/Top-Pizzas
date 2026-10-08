import { lerSessao, limparSessao } from "./sessao";

// Vazio quando o site e a API estão no mesmo endereço (o caso normal).
export const URL_API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, codigo = "SEM_CONEXAO", campos = null } = {}) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    // { campo: mensagem } quando o servidor aponta campos do formulário.
    this.campos = campos;
  }

  get semConexao() {
    return this.status === 0;
  }
}

export async function api(caminho, { metodo = "GET", corpo, escopo } = {}) {
  const sessao = escopo ? lerSessao(escopo) : null;
  if (escopo && !sessao) {
    throw new ErroApi("Sua sessão terminou. Entre novamente.", {
      status: 401,
      codigo: "SESSAO_EXPIRADA",
    });
  }

  let resposta;
  try {
    resposta = await fetch(`${URL_API}/api${caminho}`, {
      method: metodo,
      headers: {
        Accept: "application/json",
        ...(corpo !== undefined && { "Content-Type": "application/json" }),
        ...(sessao && { Authorization: `Bearer ${sessao.token}` }),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi("Sem conexão com a loja. Confira a internet e tente de novo.");
  }

  const dados =
    resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (resposta.ok) return dados;

  if (resposta.status === 401 && sessao && lerSessao(escopo)?.token === sessao.token) {
    limparSessao(escopo);
  }

  // Erro sem o formato da API vem do proxy, quando o servidor está fora do ar.
  if (!dados?.erro) {
    throw new ErroApi("A loja está fora do ar no momento. Tente de novo em instantes.");
  }

  throw new ErroApi(dados.erro.mensagem, {
    status: resposta.status,
    codigo: dados.erro.codigo,
    campos: dados.erro.campos ?? null,
  });
}
