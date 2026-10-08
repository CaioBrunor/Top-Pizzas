import { z } from "zod";
import { BORDAS, TAMANHOS } from "../../shared/catalogo.js";
import { METODOS_PAGAMENTO, STATUS_PEDIDO } from "../../shared/pedidos.js";
import { bairro, cep, complemento, nome, numero, rua, telefone } from "./comuns.js";

const item = z.object({
  produtoId: z.string().min(1).max(80),
  tamanho: z.enum([...TAMANHOS.map((t) => t.id), "unico"], "Escolha um tamanho."),
  borda: z
    .enum(
      BORDAS.map((b) => b.id),
      "Escolha uma borda.",
    )
    .default("sem"),
  quantidade: z
    .number("Informe a quantidade.")
    .int("Informe a quantidade.")
    .min(1, "Informe a quantidade.")
    .max(99, "No máximo 99 unidades de cada item."),
  observacao: z
    .string()
    .trim()
    .max(90, "A observação pode ter até 90 caracteres.")
    .default(""),
});

const entrega = z.discriminatedUnion(
  "tipo",
  [
    z.object({ tipo: z.literal("retirada") }),
    z.object({ tipo: z.literal("entrega"), cep, rua, numero, bairro, complemento }),
  ],
  "Escolha entrega ou retirada.",
);

export const pedidoSchema = z.object({
  contato: z.object({ nome, telefone }),
  itens: z
    .array(item, "O carrinho está vazio.")
    .min(1, "O carrinho está vazio.")
    .max(40, "O carrinho tem itens demais para um pedido só."),
  entrega,
  pagamento: z.object({
    metodo: z.enum(METODOS_PAGAMENTO, "Escolha a forma de pagamento."),
    troco: z
      .number("Informe o valor em dinheiro.")
      .positive("Informe o valor em dinheiro.")
      .max(100000, "Valor alto demais.")
      .nullable()
      .default(null),
  }),
  // O total que o cliente viu na tela. Se o cardápio mudou nesse meio tempo,
  // o servidor recusa em vez de cobrar um valor diferente.
  totalEsperado: z.number().nonnegative().optional(),
});

export const statusSchema = z.object({
  status: z.enum(
    STATUS_PEDIDO.map((s) => s.id),
    "Status desconhecido.",
  ),
  entregadorId: z.string().min(1).max(80).optional(),
});
