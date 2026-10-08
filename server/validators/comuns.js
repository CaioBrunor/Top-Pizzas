import { z } from "zod";
import { BAIRROS } from "../../shared/catalogo.js";
import {
  REGEX_EMAIL,
  REGEX_NOME,
  formatarCep,
  formatarTelefone,
  soDigitos,
} from "../../shared/validacao.js";

export const nome = z
  .string("Escreva seu nome completo.")
  .trim()
  .min(3, "Escreva seu nome completo.")
  .max(80, "O nome pode ter até 80 caracteres.")
  .regex(REGEX_NOME, "Use apenas letras no nome.");

export const email = z
  .string("Informe o e-mail.")
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail.")
  .max(254, "Confira o e-mail.")
  .regex(REGEX_EMAIL, "Confira o e-mail.");

export const telefone = z
  .string("Telefone incompleto.")
  .max(30, "Telefone incompleto.")
  .transform(soDigitos)
  .refine((d) => d.length === 10 || d.length === 11, "Telefone incompleto.")
  .transform(formatarTelefone);

export const cep = z
  .string("O CEP tem 8 dígitos.")
  .max(12, "O CEP tem 8 dígitos.")
  .transform(soDigitos)
  .refine((d) => d.length === 8, "O CEP tem 8 dígitos.")
  .transform(formatarCep);

export const bairro = z.enum(BAIRROS, "Ainda não entregamos neste bairro.");

export const rua = z
  .string("Informe a rua.")
  .trim()
  .min(3, "Informe a rua.")
  .max(120, "O nome da rua pode ter até 120 caracteres.");

export const numero = z
  .string("Informe o número.")
  .trim()
  .min(1, "Informe o número.")
  .max(10, "O número pode ter até 10 caracteres.");

export const complemento = z
  .string()
  .trim()
  .max(80, "O complemento pode ter até 80 caracteres.")
  .default("");
