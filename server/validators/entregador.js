import { z } from "zod";
import { DIGITOS_DO_CODIGO } from "../../shared/pedidos.js";
import { erroDeSenha } from "../../shared/validacao.js";
import { nome, telefone } from "./comuns.js";

const senha = z.string("Crie uma senha.").superRefine((valor, contexto) => {
  const erro = erroDeSenha(valor);
  if (erro) contexto.addIssue({ code: "custom", message: erro });
});

const veiculo = z
  .string()
  .trim()
  .max(40, "O veículo pode ter até 40 caracteres.")
  .default("");

// Placa antiga (ABC-1234) ou Mercosul (ABC1D23), guardada em maiúsculas.
const placa = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})?$/, "Confira a placa.")
  .default("");

const dados = { nome, telefone, veiculo, placa };

export const novoEntregadorSchema = z.object({ ...dados, senha });

// Na edição a senha é opcional: em branco, continua a mesma.
export const entregadorSchema = z.object({
  ...dados,
  senha: z.union([z.literal(""), senha]).optional(),
});

export const ativoSchema = z.object({
  ativo: z.boolean("Informe se o entregador está ativo."),
});

export const loginEntregadorSchema = z.object({
  telefone,
  senha: z
    .string("Informe a senha.")
    .min(1, "Informe a senha.")
    .max(200, "Senha longa demais."),
});

export const posicaoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  precisao: z.number().min(0).max(100000).nullable().default(null),
});

export const codigoSchema = z.object({
  codigo: z
    .string("Digite o código do cliente.")
    .trim()
    .regex(
      new RegExp(`^\\d{${DIGITOS_DO_CODIGO}}$`),
      `O código tem ${DIGITOS_DO_CODIGO} números.`,
    ),
});

export const atribuicaoSchema = z.object({
  entregadorId: z.string("Escolha o entregador.").min(1, "Escolha o entregador.").max(80),
});
