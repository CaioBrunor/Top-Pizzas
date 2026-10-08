// Clientes, entregadores e pedidos de exemplo. Existem para o painel não
// abrir vazio na primeira vez que o servidor sobe. As contas são marcadas com
// demo: true e não têm senha, então ninguém consegue entrar com elas.

import { CIDADE, PRODUTOS, TAXA_ENTREGA } from "../../shared/catalogo.js";

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

const ENTREGADORES_BASE = [
  {
    id: "e1",
    nome: "Rafael Souza",
    telefone: "(83) 98811-2040",
    veiculo: "Honda CG 160",
    placa: "QFA2B41",
  },
  {
    id: "e2",
    nome: "Jéssica Almeida",
    telefone: "(83) 98722-9015",
    veiculo: "Yamaha Factor 150",
    placa: "OGK7C12",
  },
  {
    id: "e3",
    nome: "Marcos Vinícius",
    telefone: "(83) 99630-4477",
    veiculo: "Honda Biz 125",
    placa: "PXT9D05",
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
const UM_DIA = 86400000;
const UM_MINUTO = 60000;

const idDaConta = (cliente) => `demo-${cliente.id}`;

const pizzas = PRODUTOS.filter((p) => p.tipo === "pizza" && p.disponivel);
const bebidas = PRODUTOS.filter((p) => p.tipo === "bebida");

// Gerador pseudoaleatório com semente fixa: os dados de exemplo saem sempre
// iguais, só as datas acompanham o dia de hoje.
function semente(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function gerarPedidos() {
  const rnd = semente("top-pizzas-2026");
  // Sorteio separado para os dados de entrega, para os pedidos de exemplo
  // continuarem os mesmos de antes.
  const sorteio = semente("top-pizzas-entregas");
  const agora = Date.now();
  const pedidos = [];

  for (let i = 0; i < 34; i += 1) {
    const diasAtras = Math.floor(rnd() * 9);
    // Ancorado no início do dia para o pedido nunca escorregar para a
    // véspera quando o servidor sobe de madrugada.
    const dia = new Date(agora - diasAtras * UM_DIA);
    dia.setHours(0, 0, 0, 0);
    const limite = diasAtras === 0 ? agora - dia.getTime() : UM_DIA;
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
    const taxaEntrega = retirada ? 0 : TAXA_ENTREGA;

    let status;
    if (diasAtras === 0) {
      status = ["recebido", "preparo", "forno", "entrega", "entregue"][
        Math.floor(rnd() * 5)
      ];
    } else {
      status = rnd() > 0.93 ? "cancelado" : "entregue";
    }

    const saiu = !retirada && (status === "entrega" || status === "entregue");
    const levou = ENTREGADORES_BASE[Math.floor(sorteio() * ENTREGADORES_BASE.length)];
    const minutos = 25 + Math.floor(sorteio() * 30);
    const codigo = String(Math.floor(sorteio() * 10000)).padStart(4, "0");
    const confirmadoEm = new Date(
      Math.min(agora, new Date(criadoEm).getTime() + minutos * UM_MINUTO),
    ).toISOString();

    pedidos.push({
      id: `TP-${2100 + i}`,
      criadoEm,
      atualizadoEm: criadoEm,
      status,
      origem: "site",
      clienteId: idDaConta(cliente),
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
        cidade: CIDADE,
      },
      pagamento: {
        metodo: PAGAMENTOS[Math.floor(rnd() * PAGAMENTOS.length)],
        troco: null,
      },
      itens,
      subtotal,
      taxaEntrega,
      total: subtotal + taxaEntrega,
      codigoEntrega: retirada ? null : codigo,
      entregador: saiu
        ? {
            id: idDaConta(levou),
            nome: levou.nome,
            veiculo: levou.veiculo,
            placa: levou.placa,
          }
        : null,
      confirmacao:
        saiu && status === "entregue"
          ? { tipo: "codigo", em: confirmadoEm }
          : null,
      historico: [{ status, em: criadoEm }],
    });
  }

  return pedidos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}

function gerarContas(pedidos) {
  return CLIENTES_BASE.map((cliente) => {
    const dele = pedidos.filter((p) => p.clienteId === idDaConta(cliente));
    const ultimaEntrega = dele.find((p) => p.entrega.tipo === "entrega");
    const primeiro = dele.at(-1);

    return {
      id: idDaConta(cliente),
      papel: "cliente",
      demo: true,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: ultimaEntrega
        ? {
            cep: ultimaEntrega.entrega.cep,
            rua: ultimaEntrega.entrega.rua,
            numero: ultimaEntrega.entrega.numero,
            bairro: cliente.bairro,
          }
        : { bairro: cliente.bairro },
      criadoEm:
        primeiro?.criadoEm ?? new Date(Date.now() - 9 * UM_DIA).toISOString(),
    };
  });
}

function gerarEntregadores() {
  const criadoEm = new Date(Date.now() - 20 * UM_DIA).toISOString();
  return ENTREGADORES_BASE.map((entregador) => ({
    ...entregador,
    id: idDaConta(entregador),
    papel: "entregador",
    demo: true,
    criadoEm,
  }));
}

export function gerarDadosDeExemplo() {
  const pedidos = gerarPedidos();
  return {
    pedidos,
    contas: [...gerarContas(pedidos), ...gerarEntregadores()],
  };
}

export function catalogoInicial() {
  const agora = new Date().toISOString();
  return PRODUTOS.map((p) => ({ ...p, criadoEm: agora, atualizadoEm: agora }));
}
