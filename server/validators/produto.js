import { z } from "zod";
import { CATEGORIAS, arredondar } from "../../shared/catalogo.js";

const preco = z
  .number("Informe o preço.")
  .positive("Informe o preço.")
  .max(9999, "Preço alto demais.")
  .transform(arredondar);

// Só caminhos do próprio site ("/assets/...") ou endereços https. Isso deixa
// de fora "javascript:", "data:" e companhia.
const imagem = z
  .string()
  .trim()
  .max(300, "O caminho da foto pode ter até 300 caracteres.")
  .regex(/^(\/(?![/\\])|https:\/\/)\S*$/, "Use um caminho como /assets/pizzas/foto.png ou um link https.")
  .nullable()
  .default(null);

export const produtoSchema = z
  .object({
    nome: z
      .string("Dê um nome ao produto.")
      .trim()
      .min(2, "Dê um nome ao produto.")
      .max(60, "O nome pode ter até 60 caracteres."),
    categoria: z.enum(
      CATEGORIAS.map((c) => c.id),
      "Escolha uma categoria.",
    ),
    descricao: z
      .string()
      .trim()
      .max(300, "A descrição pode ter até 300 caracteres.")
      .default(""),
    imagem,
    precos: z.object({
      broto: preco.optional(),
      media: preco.optional(),
      grande: preco.optional(),
      unico: preco.optional(),
    }),
    tempoPreparo: z
      .number("Informe o tempo em minutos.")
      .int("Informe o tempo em minutos.")
      .min(0, "Informe o tempo em minutos.")
      .max(240, "No máximo 240 minutos.")
      .default(0),
    disponivel: z.boolean().default(true),
    destaque: z.boolean().default(false),
    tags: z
      .array(z.string().trim().min(1).max(24))
      .max(6, "No máximo 6 etiquetas.")
      .default([]),
  })
  .transform((dados, contexto) => {
    const tipo = dados.categoria === "bebidas" ? "bebida" : "pizza";
    const exigidos = tipo === "bebida" ? ["unico"] : ["broto", "media", "grande"];

    const precos = {};
    for (const tamanho of exigidos) {
      if (dados.precos[tamanho] === undefined) {
        contexto.addIssue({
          code: "custom",
          path: ["precos", tamanho],
          message: "Informe o preço.",
        });
      }
      precos[tamanho] = dados.precos[tamanho];
    }
    return { ...dados, tipo, precos };
  });

export const disponibilidadeSchema = z.object({
  disponivel: z.boolean("Informe se o produto está disponível."),
});
