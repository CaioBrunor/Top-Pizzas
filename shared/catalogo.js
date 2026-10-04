export const VERSAO_CATALOGO = 5;

export const TAMANHOS = [
  { id: "broto", nome: "Broto", fatias: 4, serve: "1 pessoa" },
  { id: "media", nome: "Média", fatias: 8, serve: "2 a 3 pessoas" },
  { id: "grande", nome: "Grande", fatias: 12, serve: "3 a 4 pessoas" },
];

export const BORDAS = [
  { id: "sem", nome: "Sem borda recheada", preco: 0 },
  { id: "catupiry", nome: "Borda de catupiry", preco: 9 },
  { id: "cheddar", nome: "Borda de cheddar", preco: 9 },
  { id: "chocolate", nome: "Borda de chocolate", preco: 11 },
];

export const CATEGORIAS = [
  { id: "tradicionais", nome: "Tradicionais" },
  { id: "especiais", nome: "Especiais da casa" },
  { id: "doces", nome: "Doces" },
  { id: "bebidas", nome: "Bebidas" },
];

export const PRODUTOS = [
  {
    id: "margherita",
    nome: "Margherita",
    categoria: "tradicionais",
    tipo: "pizza",
    imagem: "/assets/pizzas/margherita.png",
    descricao:
      "Molho de tomate San Marzano, tomate, mussarela de búfala, manjericão fresco e azeite extra virgem.",
    precos: { broto: 32, media: 48, grande: 62 },
    tempoPreparo: 18,
    disponivel: true,
    destaque: true,
    tags: ["vegetariana", "mais vendida"],
  },
  {
    id: "calabresa",
    nome: "Calabresa artesanal",
    categoria: "tradicionais",
    tipo: "pizza",
    imagem: "/assets/pizzas/calabresa.png",
    descricao:
      "Calabresa defumada fatiada na hora, azeitona preta e orégano da serra.",
    precos: { broto: 34, media: 52, grande: 68 },
    tempoPreparo: 18,
    disponivel: true,
    destaque: true,
    tags: ["mais vendida"],
  },
  {
    id: "portuguesa",
    nome: "Portuguesa",
    categoria: "tradicionais",
    tipo: "pizza",
    imagem: "/assets/pizzas/portuguesa.png",
    descricao:
      "Presunto, ovo caipira, cebola, pimentão, azeitona preta e orégano. Do jeito que sempre foi.",
    precos: { broto: 36, media: 55, grande: 71 },
    tempoPreparo: 20,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "quatro-queijos",
    nome: "Quatro queijos",
    categoria: "tradicionais",
    tipo: "pizza",
    imagem: "/assets/pizzas/quatro-queijos.png",
    descricao:
      "Mussarela, gorgonzola, parmesão e catupiry derretidos no forno.",
    precos: { broto: 38, media: 58, grande: 74 },
    tempoPreparo: 19,
    disponivel: true,
    destaque: false,
    tags: ["vegetariana"],
  },
  {
    id: "frango-catupiry",
    nome: "Frango com catupiry",
    categoria: "tradicionais",
    tipo: "pizza",
    imagem: "/assets/pizzas/frango-catupiry.png",
    descricao: "Frango desfiado temperado no alho, catupiry original e milho.",
    precos: { broto: 36, media: 54, grande: 70 },
    tempoPreparo: 20,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "carne-de-sol",
    nome: "Carne de sol com queijo coalho",
    categoria: "especiais",
    tipo: "pizza",
    imagem: "/assets/pizzas/carne-de-sol.png",
    descricao:
      "Carne de sol desfiada da serra, tomate-cereja, manjericão e queijo coalho em cubos.",
    precos: { broto: 45, media: 68, grande: 88 },
    tempoPreparo: 24,
    disponivel: true,
    destaque: true,
    tags: ["regional", "assinatura"],
  },
  {
    id: "burrata-tomate",
    nome: "Burrata e tomate confitado",
    categoria: "especiais",
    tipo: "pizza",
    imagem: "/assets/pizzas/burrata-tomate.png",
    descricao:
      "Burrata cremosa colocada depois do forno, tomate confitado lentamente e pesto de manjericão.",
    precos: { broto: 49, media: 74, grande: 96 },
    tempoPreparo: 22,
    disponivel: true,
    destaque: true,
    tags: ["vegetariana"],
  },
  {
    id: "pepperoni-mel",
    nome: "Pepperoni com mel de engenho",
    categoria: "especiais",
    tipo: "pizza",
    imagem: "/assets/pizzas/pepperoni-mel.png",
    descricao:
      "Pepperoni que encurva no forno, fio de mel de engenho e pimenta-calabresa.",
    precos: { broto: 44, media: 66, grande: 86 },
    tempoPreparo: 21,
    disponivel: true,
    destaque: false,
    tags: ["picante"],
  },
  {
    id: "cogumelos",
    nome: "Cogumelos e trufa",
    categoria: "especiais",
    tipo: "pizza",
    imagem: "/assets/pizzas/cogumelos.png",
    descricao:
      "Mix de shitake e paris salteados, creme de trufa e nozes tostadas.",
    precos: { broto: 47, media: 71, grande: 92 },
    tempoPreparo: 23,
    disponivel: false,
    destaque: false,
    tags: ["vegetariana"],
  },
  {
    id: "brigadeiro",
    nome: "Brigadeiro com morango",
    categoria: "doces",
    tipo: "pizza",
    imagem: "/assets/pizzas/brigadeiro.png",
    descricao: "Brigadeiro belga, morango fatiado e fio de leite condensado.",
    precos: { broto: 34, media: 50, grande: 64 },
    tempoPreparo: 15,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "banana-canela",
    nome: "Banana com canela",
    categoria: "doces",
    tipo: "pizza",
    imagem: "/assets/pizzas/banana-canela.png",
    descricao:
      "Banana da terra caramelizada, canela em pau moída na hora e leite condensado.",
    precos: { broto: 32, media: 47, grande: 60 },
    tempoPreparo: 15,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "refri-cola",
    nome: "Coca-Cola 2L",
    categoria: "bebidas",
    tipo: "bebida",
    imagem: "/assets/pizzas/refri-cola.png",
    descricao: "Garrafa de 2 litros, bem gelada.",
    precos: { unico: 14 },
    tempoPreparo: 0,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "refri-guarana",
    nome: "Guaraná Antarctica 2L",
    categoria: "bebidas",
    tipo: "bebida",
    imagem: "/assets/pizzas/refri-guarana.png",
    descricao: "Garrafa de 2 litros, bem gelada.",
    precos: { unico: 14 },
    tempoPreparo: 0,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "suco-natural",
    nome: "Suco natural 500ml",
    categoria: "bebidas",
    tipo: "bebida",
    imagem: "/assets/pizzas/suco-natural.png",
    descricao: "Laranja, maracujá, caju ou acerola. Feito na hora.",
    precos: { unico: 12 },
    tempoPreparo: 0,
    disponivel: true,
    destaque: false,
    tags: [],
  },
  {
    id: "cerveja-long",
    nome: "Cerveja long neck",
    categoria: "bebidas",
    tipo: "bebida",
    imagem: "/assets/pizzas/cerveja-long.png",
    descricao: "Pilsen 330ml. Venda proibida para menores de 18 anos.",
    precos: { unico: 11 },
    tempoPreparo: 0,
    disponivel: true,
    destaque: false,
    tags: [],
  },
];

export const TAXA_ENTREGA = 8;
export const PEDIDO_MINIMO = 30;

export const CIDADE = "Campina Grande";

export const BAIRROS = [
  "Catolé",
  "Bodocongó",
  "Centro",
  "Liberdade",
  "Prata",
  "Universitário",
  "José Pinheiro",
  "Santa Rosa",
  "Malvinas",
  "Alto Branco",
  "Mirante",
];

// Centro de cada bairro atendido, segundo o OpenStreetMap. O mapa da entrega
// usa para mostrar a região de destino. O endereço exato do cliente não é
// transformado em coordenadas.
export const COORDENADAS_DOS_BAIRROS = {
  Catolé: { lat: -7.2348, lng: -35.8787 },
  Bodocongó: { lat: -7.219, lng: -35.9192 },
  Centro: { lat: -7.219, lng: -35.8825 },
  Liberdade: { lat: -7.2364, lng: -35.8926 },
  Prata: { lat: -7.2201, lng: -35.894 },
  Universitário: { lat: -7.2098, lng: -35.9143 },
  "José Pinheiro": { lat: -7.2256, lng: -35.8722 },
  "Santa Rosa": { lat: -7.2337, lng: -35.9066 },
  Malvinas: { lat: -7.233, lng: -35.9241 },
  "Alto Branco": { lat: -7.2022, lng: -35.8819 },
  Mirante: { lat: -7.2333, lng: -35.8665 },
};

// De onde os pedidos saem. Troque pelas coordenadas reais da loja.
export const LOJA = {
  nome: "Top Pizzas",
  endereco: "Rua 1, 333 — Alto Branco",
  ...COORDENADAS_DOS_BAIRROS["Alto Branco"],
};

export const arredondar = (valor) => Math.round(valor * 100) / 100;

// O site usa esta conta para mostrar o preço e o servidor refaz a mesma conta
// ao fechar o pedido. Devolve null quando a combinação não existe no cardápio.
export function calcularPrecoUnitario(produto, tamanhoId, bordaId = "sem") {
  const valido = (preco) => Number.isFinite(preco) && preco > 0;

  if (produto.tipo === "bebida") {
    const preco = produto.precos?.unico;
    return valido(preco) ? preco : null;
  }

  const preco = produto.precos?.[tamanhoId];
  const borda = BORDAS.find((b) => b.id === bordaId);
  if (!TAMANHOS.some((t) => t.id === tamanhoId) || !borda || !valido(preco)) {
    return null;
  }
  return arredondar(preco + borda.preco);
}
