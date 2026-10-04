# Top Pizzas

Site de pedidos de uma pizzaria: cardápio, carrinho, checkout com conta de cliente, acompanhamento do pedido em tempo real, controle de entregadores com mapa e painel administrativo. Funciona como PWA (instalável e com modo offline).

- **Site:** React + Vite
- **API:** Node.js + Express (rotas, controllers e models)
- **Tempo real:** Socket.IO
- **Mapa:** Leaflet + OpenStreetMap
- **Dados:** arquivos JSON no servidor, com a mesma interface do `localStorage`

## Como rodar

Precisa do Node.js 20.12 ou mais novo.

```bash
npm install
cp .env.example .env   # e ajuste a senha do painel
npm run dev
```

`npm run dev` sobe os dois processos juntos:

| O quê | Endereço |
| --- | --- |
| Site (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3333/api |

O Vite encaminha `/api` e `/socket.io` para a API, então no navegador tudo acontece em `localhost:5173`.

O painel fica em `/admin`. O usuário e a senha são os de `ADMIN_USUARIO` e `ADMIN_SENHA` no `.env`. Trocar esses valores e reiniciar o servidor atualiza o acesso.

A área do entregador fica em `/entregador`. Cada entregador entra com o telefone e a senha cadastrados em **Painel > Entregadores**.

Na primeira vez, o servidor grava o cardápio inicial e alguns clientes, entregadores e pedidos de exemplo, para o painel não abrir vazio. As contas de exemplo não têm senha.

### Versão de produção (e teste do PWA)

O service worker só existe no build, então o modo offline e a instalação são testados assim:

```bash
npm run build
npm start
```

Abra http://localhost:3333: o mesmo servidor entrega o site e a API. Fora do `localhost`, o PWA exige HTTPS.

## Estrutura

```
server/
  index.js            sobe o servidor HTTP e o Socket.IO
  app.js              monta o Express: segurança, rotas, site estático, erros
  config/env.js       lê o .env
  routes/             endpoints da API
  controllers/        o que cada endpoint faz
  models/             Usuario, Produto, Pedido (leitura e gravação)
  middlewares/        segurança, autenticação, validação, erros, log
  validators/         regras de cada corpo de requisição (zod)
  services/           senha, token, tempo real, cálculo do pedido, código de
                      entrega, posição dos entregadores, dados iniciais
  storage/            LocalStorage do servidor (arquivos JSON)
  data/               os dados gravados (fora do Git)
shared/               regras usadas pelo site e pelo servidor (preços, status, validação)
src/                  o site
  context/            AuthContext, LojaContext, PainelContext, CarrinhoContext,
                      EntregadorContext
  components/Mapa.jsx mapa da entrega (carregado só nas telas que usam)
  pages/entregador/   área do entregador
  lib/api.js          chamadas à API
  lib/sessao.js       sessões guardadas no localStorage
  lib/tempoReal.js    conexão Socket.IO
  pwa/registrar.js    registro do service worker e instalação
public/
  sw.js               service worker
  manifest.webmanifest
```

## API

Respostas de erro têm sempre o formato `{ "erro": { "mensagem", "codigo", "campos"? } }`.

| Método | Rota | Quem pode | O que faz |
| --- | --- | --- | --- |
| GET | `/api/saude` | todos | confere se a API está no ar |
| POST | `/api/auth/cadastrar` | todos | cria a conta do cliente |
| POST | `/api/auth/entrar` | todos | login do cliente |
| POST | `/api/auth/admin/entrar` | todos | login do painel |
| POST | `/api/auth/entregador/entrar` | todos | login do entregador (telefone e senha) |
| GET | `/api/auth/eu` | logado | dados da conta do token |
| PUT | `/api/auth/eu` | cliente | atualiza nome, telefone e endereço |
| GET | `/api/produtos` | todos | cardápio |
| GET | `/api/produtos/:id` | todos | um produto |
| POST | `/api/produtos` | admin | cadastra produto |
| PUT | `/api/produtos/:id` | admin | edita produto |
| PATCH | `/api/produtos/:id/disponibilidade` | admin | põe ou tira do cardápio |
| DELETE | `/api/produtos/:id` | admin | exclui produto |
| POST | `/api/pedidos` | cliente | faz um pedido |
| GET | `/api/pedidos/meus` | cliente | pedidos da própria conta |
| GET | `/api/pedidos/:id` | dono ou admin | um pedido |
| GET | `/api/pedidos` | admin | todos os pedidos |
| PATCH | `/api/pedidos/:id/status` | admin | move o pedido de etapa (ao sair para entrega, leva o `entregadorId`) |
| PUT | `/api/pedidos/:id/entregador` | admin | troca quem está levando o pedido |
| GET | `/api/entregadores` | admin | entregadores, com a posição atual |
| POST | `/api/entregadores` | admin | cadastra entregador |
| PUT | `/api/entregadores/:id` | admin | edita entregador (e troca a senha) |
| PATCH | `/api/entregadores/:id/ativo` | admin | ativa ou desativa o acesso |
| DELETE | `/api/entregadores/:id` | admin | exclui entregador |
| GET | `/api/entregas` | entregador | entregas que estão com ele e as feitas hoje |
| POST | `/api/entregas/posicao` | entregador | informa onde ele está |
| POST | `/api/entregas/:id/confirmar` | entregador | fecha a entrega com o código do cliente |
| GET | `/api/clientes` | admin | contas de clientes com resumo de pedidos |
| POST | `/api/admin/restaurar` | admin | volta aos dados de exemplo |

Rotas protegidas recebem o token no cabeçalho `Authorization: Bearer <token>`.

## Tempo real

O site só escuta. Toda alteração entra pela API e o servidor avisa quem precisa saber:

| Evento | Quem recebe |
| --- | --- |
| `produto:salvo`, `produto:removido` | todos (o cardápio muda ao vivo) |
| `pedido:criado`, `pedido:atualizado` | o painel (sem o código de entrega) |
| `meu-pedido:criado`, `meu-pedido:atualizado` | o dono do pedido (com o código de entrega) |
| `meu-pedido:posicao` | o dono do pedido, enquanto o entregador leva o pedido dele |
| `entrega:salva`, `entrega:encerrada` | o entregador que está com o pedido |
| `entregador:salvo`, `entregador:removido`, `entregador:posicao` | o painel |
| `cliente:salvo` | o painel |
| `dados:restaurados` | todos |

Ao reconectar depois de uma queda, cada tela busca os dados de novo, então nada do que aconteceu no intervalo se perde.

## Entregas

1. O pedido de entrega nasce com um **código de 4 dígitos** que só o cliente vê, na página do pedido.
2. Quando o pedido sai do forno, o painel escolhe o entregador e despacha.
3. O entregador recebe a entrega no celular, em `/entregador`: endereço, itens, quanto receber e um atalho para a rota.
4. Enquanto ele leva o pedido, o app manda a posição do GPS. O cliente acompanha no mapa da página do pedido e o painel, em **Entregadores**.
5. Na porta, o cliente diz o código e o entregador digita. Só com o código certo o pedido vira "Entregue".

O código nunca é enviado ao painel nem ao entregador, senão não provaria que o pedido chegou à pessoa certa. Depois de 5 códigos errados, a entrega fica bloqueada por 10 minutos. Se o entregador não conseguir confirmar, o painel pode fechar a entrega em "Entregue sem código", e isso fica registrado no pedido.

Sobre a localização:

- O navegador só libera o GPS em HTTPS ou em `localhost`.
- A posição é enviada enquanto o app do entregador está aberto na tela. Com a tela apagada, o navegador para de informar.
- O servidor só guarda a última posição, na memória, e só de quem está com pedido na rua. Terminou a última entrega, a posição é esquecida.
- O mapa marca a região do bairro de destino, não o endereço exato do cliente. As coordenadas dos bairros e da loja estão em `shared/catalogo.js`.

Na retirada não há entregador nem código: as etapas finais aparecem como "Pronto para retirar" e "Retirado".

## Onde ficam os dados

**No servidor**, em `server/data/`, um arquivo por chave: `usuarios.json`, `produtos.json`, `pedidos.json`. Quem lê e grava é `server/storage/LocalStorage.js`, com `getItem` e `setItem` como no navegador. Para trocar por um banco de dados no futuro, só os arquivos de `server/models/` mudam.

**No navegador**, no `localStorage` (prefixo `top-pizzas:`):

| Chave | Conteúdo |
| --- | --- |
| `sessao:cliente` | token e dados atuais do cliente logado |
| `sessao:admin` | token e dados do admin logado |
| `sessao:entregador` | token e dados do entregador logado |
| `produtos` | última cópia do cardápio |
| `meusPedidos` | pedidos do cliente logado |
| `painel` | pedidos, clientes e entregadores vistos no painel |
| `minhasEntregas` | entregas que estão com o entregador logado |
| `carrinho`, `modoEntrega` | carrinho em andamento |

É essa cópia que o site mostra quando está sem internet. Ao sair da conta, ou quando o site percebe que a sessão venceu, os dados pessoais são apagados do navegador.

## Segurança

- **Senhas** guardadas só como hash (scrypt com sal). Nunca saem do servidor.
- **Sessão** por token JWT com validade (7 dias para cliente, 8 horas para o painel, 12 horas para entregador).
- **Permissões** por papel: `autenticar` confere o token e `exigirPapel` barra quem não tem o papel da rota (cliente, admin ou entregador). Um cliente só enxerga os próprios pedidos e um entregador, só as entregas que estão com ele.
- **Entregador desativado** no painel perde o acesso na hora: o token deixa de valer e a conexão cai.
- **Validação** de todo corpo de requisição no servidor (`validar` + zod). Campos fora do previsto são descartados.
- **Preços** recalculados no servidor a cada pedido. O valor enviado pelo navegador é ignorado.
- **Limite de requisições:** geral, por login errado, por cadastro, por pedido e por posição enviada.
- **Cabeçalhos de segurança** (helmet), com política de conteúdo (CSP) que só aceita scripts do próprio site.
- **CORS** restrito às origens de `ORIGENS_PERMITIDAS`.
- **Erros** inesperados ficam no log do servidor. O cliente recebe só uma mensagem genérica.

Antes de publicar: troque `ADMIN_SENHA`, defina `JWT_SECRET`, use HTTPS (`FORCAR_HTTPS=true`) e, atrás de um proxy, `PROXIES_CONFIAVEIS=1`.

## PWA

- `public/manifest.webmanifest` e os ícones em `public/icons/` tornam o site instalável. O botão "Instalar o app" aparece quando o navegador permite.
- `public/sw.js` guarda os arquivos principais na instalação (página, JavaScript, CSS, ícones) e as fotos e fontes conforme o uso.
- Sem internet, o site abre com o cardápio, o carrinho e os pedidos já vistos. Fazer pedido e alterar dados exige conexão, e a tela avisa.
- Quando há um build novo, aparece o aviso "Tem versão nova do site".

## Limites conhecidos

- Os dados em arquivo JSON servem para uma loja pequena e um servidor só. Hospedagens que apagam o disco a cada publicação perdem os dados: use um disco persistente ou troque os models por um banco.
- O pagamento continua simulado. Nenhum dado de cartão é enviado ao servidor.
- Não há recuperação de senha por e-mail.
- O mapa usa os blocos públicos do OpenStreetMap, que servem para pouco movimento. Com muito acesso, contrate um serviço de mapas e troque o endereço em `src/components/MapaLeaflet.jsx`.
