const CODIGOS = {
  400: "REQUISICAO_INVALIDA",
  401: "NAO_AUTENTICADO",
  403: "SEM_PERMISSAO",
  404: "NAO_ENCONTRADO",
  409: "CONFLITO",
  413: "CORPO_GRANDE_DEMAIS",
  422: "VALIDACAO",
  429: "MUITAS_TENTATIVAS",
};

export class ErroHttp extends Error {
  constructor(status, mensagem, { codigo, campos } = {}) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo ?? CODIGOS[status] ?? "ERRO";
    this.campos = campos;
  }
}

export function naoEncontrado(req, res, next) {
  next(new ErroHttp(404, "Endereço não encontrado."));
}

// O Express reconhece o tratador de erros pelos quatro parâmetros, por isso
// `next` fica na assinatura mesmo sem uso.
export function tratarErros(erro, req, res, next) {
  let resposta = erro;

  if (!(erro instanceof ErroHttp)) {
    if (erro.type === "entity.parse.failed") {
      resposta = new ErroHttp(400, "O corpo da requisição não é um JSON válido.");
    } else if (erro.type === "entity.too.large") {
      resposta = new ErroHttp(413, "O corpo da requisição é grande demais.");
    } else {
      console.error(`[erro] ${req.method} ${req.originalUrl.split("?")[0]}`, erro);
      resposta = new ErroHttp(500, "Algo deu errado do nosso lado. Tente de novo em instantes.", {
        codigo: "ERRO_INTERNO",
      });
    }
  }

  res.status(resposta.status).json({
    erro: {
      mensagem: resposta.message,
      codigo: resposta.codigo,
      ...(resposta.campos && { campos: resposta.campos }),
    },
  });
}
