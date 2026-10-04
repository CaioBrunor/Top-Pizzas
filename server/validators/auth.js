import { z } from "zod";
import { erroDeSenha } from "../../shared/validacao.js";
import { bairro, cep, complemento, email, nome, numero, rua, telefone } from "./comuns.js";

const senhaNova = z.string("Crie uma senha.").superRefine((valor, contexto) => {
  const erro = erroDeSenha(valor);
  if (erro) contexto.addIssue({ code: "custom", message: erro });
});

// No login a senha só precisa existir: a regra de formato vale no cadastro.
const senhaDigitada = z
  .string("Informe a senha.")
  .min(1, "Informe a senha.")
  .max(200, "Senha longa demais.");

export const cadastroSchema = z
  .object({ nome, email, telefone, senha: senhaNova })
  .refine((dados) => dados.senha.toLowerCase() !== dados.email, {
    path: ["senha"],
    message: "A senha não pode ser igual ao e-mail.",
  });

export const loginSchema = z.object({ email, senha: senhaDigitada });

export const loginAdminSchema = z.object({
  usuario: z
    .string("Informe o usuário.")
    .trim()
    .toLowerCase()
    .min(1, "Informe o usuário.")
    .max(60, "Usuário longo demais."),
  senha: senhaDigitada,
});

// No perfil o endereço pode ficar em branco: ele só é obrigatório na hora de
// pedir uma entrega.
const ouEmBranco = (campo, mensagem) => z.union([z.literal(""), campo], mensagem);

export const perfilSchema = z.object({
  nome,
  telefone,
  endereco: z
    .object({
      cep: ouEmBranco(cep, "O CEP tem 8 dígitos."),
      rua: ouEmBranco(rua, "Informe a rua completa."),
      numero: ouEmBranco(numero, "O número pode ter até 10 caracteres."),
      bairro: ouEmBranco(bairro, "Ainda não entregamos neste bairro."),
      complemento,
    })
    .partial()
    .default({}),
});
