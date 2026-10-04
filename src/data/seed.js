// Pedidos e clientes de exemplo. Existem so para o painel admin nao abrir
// vazio na fase 1. Na fase 2 tudo isso vem do banco.

import { PRODUTOS } from "./catalogo";
import { semente } from "../lib/format";

const CLIENTES_BASE = [
  {
    id: "c1",
    nome: "Caio Bruno Rodrigues de Santana",
    telefone: "(83) 99999-7777",
    email: "caio.bruno@email.com",
    bairro: "José Pinheiro",
  },
  {
    id: "c2",
    nome: "Cauã Benicio",
    telefone: "(83) 99444-1000",
    email: "caua.benicio@email.com",
    bairro: "Alto Branco",
  },
  {
    id: "c3",
    nome: "Luiz Eduardo",
    telefone: "(83) 99111-2222",
    email: "luiz.eduardo@email.com",
    bairro: "Centro",
  },
  {
    id: "c4",
    nome: "Diego Nóbrega",
    telefone: "(83) 99145-8862",
    email: "diego.nb@email.com",
    bairro: "Liberdade",
  },
  {
    id: "c5",
    nome: "Zárak Barreto",
    telefone: "(83) 98330-7714",
    email: "zarak.barreto@email.com",
    bairro: "Catolé",
  },
  {
    id: "c6",
    nome: "Thiago Ramalho",
    telefone: "(83) 99457-1128",
    email: "thiago.ram@email.com",
    bairro: "Universitário",
  },
  {
    id: "c7",
    nome: "Larissa Duarte",
    telefone: "(83) 98692-3340",
    email: "lari.duarte@email.com",
    bairro: "José Pinheiro",
  },
  {
    id: "c8",
    nome: "Ana Beatriz Lopes",
    telefone: "(83) 99271-6605",
    email: "ana.lopes@email.com",
    bairro: "Catolé",
  },
];

const RUAS = [
  "Rua João Suassuna",
  "Av. Floriano Peixoto",
  "Rua Vigário Calixto",
  "Av. Manoel Tavares",
  "Rua Tavares Cavalcante",
  "Av. Presidente Getúlio Vargas",
];

const PAGAMENTOS = ["pix", "cartao", "dinheiro"];
const TAMANHOS_IDS = ["broto", "media", "grande"];

const pizzas = PRODUTOS.filter((p) => p.tipo === "pizza" && p.disponivel);
const bebidas = PRODUTOS.filter((p) => p.tipo === "bebida");

function montarItem(rnd) {
  const produto = pizzas[Math.floor(rnd() * pizzas.length)];
  const tamanho = TAMANHOS_IDS[Math.floor(rnd() * TAMANHOS_IDS.length)];
  const quantidade = rnd() > 0.78 ? 2 : 1;
  return {
    linhaId: `${produto.id}-${tamanho}-${Math.floor(rnd() * 1e6)}`,
    produtoId: produto.id,
    nome: produto.nome,
    tamanho,
    tamanhoNome:
      tamanho === "broto" ? "Broto" : tamanho === "media" ? "Média" : "Grande",
    borda: "sem",
    bordaNome: "Sem borda recheada",
    observacao: "",
    quantidade,
    precoUnitario: produto.precos[tamanho],
  };
}

export function gerarPedidosIniciais() {
  const rnd = semente("top-pizzas-2026");
  const agora = Date.now();
  const pedidos = [];

  for (let i = 0; i < 34; i += 1) {
    const diasAtras = Math.floor(rnd() * 9);
    // Ancorado no inicio do dia para o pedido nunca escorregar para a
    // vespera quando a pagina abre de madrugada.
    const dia = new Date(agora - diasAtras * 86400000);
    dia.setHours(0, 0, 0, 0);
    const limite = diasAtras === 0 ? new Date(agora) - dia : 86400000;
    const criadoEm = new Date(dia.getTime() + rnd() * limite).toISOString();

    const cliente = CLIENTES_BASE[Math.floor(rnd() * CLIENTES_BASE.length)];
    const itens = [montarItem(rnd)];
    if (rnd() > 0.55) itens.push(montarItem(rnd));
    if (rnd() > 0.6) {
      const bebida = bebidas[Math.floor(rnd() * bebidas.length)];
      itens.push({
        linhaId: `${bebida.id}-${Math.floor(rnd() * 1e6)}`,
        produtoId: bebida.id,
        nome: bebida.nome,
        tamanho: "unico",
        tamanhoNome: "Unidade",
        borda: "sem",
        bordaNome: "",
        observacao: "",
        quantidade: 1,
        precoUnitario: bebida.precos.unico,
      });
    }

    const subtotal = itens.reduce(
      (s, it) => s + it.precoUnitario * it.quantidade,
      0,
    );
    const retirada = rnd() > 0.82;
    const taxaEntrega = retirada ? 0 : 8;

    let status;
    if (diasAtras === 0) {
      status = ["recebido", "preparo", "forno", "entrega", "entregue"][
        Math.floor(rnd() * 5)
      ];
    } else {
      status = rnd() > 0.93 ? "cancelado" : "entregue";
    }

    pedidos.push({
      id: `TP-${2100 + i}`,
      criadoEm,
      status,
      origem: "site",
      cliente: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
      },
      entrega: {
        tipo: retirada ? "retirada" : "entrega",
        cep: "58400-000",
        rua: RUAS[Math.floor(rnd() * RUAS.length)],
        numero: String(Math.floor(rnd() * 900) + 20),
        bairro: cliente.bairro,
        complemento: "",
        cidade: "Campina Grande",
      },
      pagamento: {
        metodo: PAGAMENTOS[Math.floor(rnd() * PAGAMENTOS.length)],
        troco: "",
      },
      itens,
      subtotal,
      taxaEntrega,
      total: subtotal + taxaEntrega,
    });
  }

  return pedidos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}

export const CLIENTES_SEED = CLIENTES_BASE;
