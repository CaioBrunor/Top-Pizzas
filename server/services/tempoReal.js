import { Server } from "socket.io";
import { config } from "../config/env.js";
import { origemPermitida } from "../middlewares/seguranca.js";
import { usuarioDoToken } from "./token.js";
import {
  pedidoParaCliente,
  pedidoParaEntregador,
  pedidoParaPainel,
} from "./visoes.js";

const SALA_ADMIN = "admin";
const salaDoCliente = (id) => `cliente:${id}`;
const salaDoEntregador = (id) => `entregador:${id}`;

// setTimeout não aceita esperas maiores que isto (cerca de 24 dias).
const ESPERA_MAXIMA = 2 ** 31 - 1;

let io = null;

/**
 * Liga o Socket.IO ao servidor HTTP. O site só escuta: toda alteração entra
 * pela API e o servidor avisa quem precisa saber.
 *
 * - todo mundo recebe as mudanças do cardápio;
 * - cada cliente recebe as mudanças dos próprios pedidos;
 * - cada entregador recebe as entregas que estão com ele;
 * - o painel recebe todos os pedidos, clientes e entregadores.
 */
export function iniciarTempoReal(servidorHttp) {
  io = new Server(servidorHttp, {
    serveClient: false,
    maxHttpBufferSize: 16 * 1024,
    cors: { origin: config.origensPermitidas },
    allowRequest: (req, responder) =>
      responder(null, origemPermitida(req.headers.origin, req.headers.host)),
  });

  // Um navegador pode estar com mais de uma conta aberta ao mesmo tempo
  // (cliente, painel, entregador), então cada token é conferido por conta
  // própria. Token inválido não derruba a conexão: só não dá acesso às salas
  // privadas.
  io.use(async (socket, proximo) => {
    const { tokenCliente, tokenAdmin, tokenEntregador } =
      socket.handshake.auth ?? {};
    const sessaoDe = async (token, papel) => {
      try {
        const sessao = await usuarioDoToken(token);
        return sessao?.usuario.papel === papel ? sessao : null;
      } catch (erro) {
        // Banco indisponível: a conexão segue, só sem as salas privadas.
        console.error(`[tempo real] não foi possível conferir o token: ${erro.message}`);
        return null;
      }
    };

    socket.data.cliente = await sessaoDe(tokenCliente, "cliente");
    socket.data.admin = await sessaoDe(tokenAdmin, "admin");
    socket.data.entregador = await sessaoDe(tokenEntregador, "entregador");
    proximo();
  });

  io.on("connection", (socket) => {
    const { cliente, admin, entregador } = socket.data;
    if (cliente) socket.join(salaDoCliente(cliente.usuario.id));
    if (admin) socket.join(SALA_ADMIN);
    if (entregador) socket.join(salaDoEntregador(entregador.usuario.id));

    // Quando o token vence, a conexão cai e o site reconecta sem ele.
    const vencimentos = [cliente, admin, entregador]
      .filter(Boolean)
      .map((s) => s.expiraEm);
    if (vencimentos.length > 0) {
      const falta = Math.min(...vencimentos) - Date.now();
      const relogio = setTimeout(
        () => socket.disconnect(true),
        Math.min(Math.max(falta, 0), ESPERA_MAXIMA),
      );
      socket.on("disconnect", () => clearTimeout(relogio));
    }
  });

  return io;
}

export function avisarTodos(evento, dados) {
  io?.emit(evento, dados);
}

export function avisarAdmins(evento, dados) {
  io?.to(SALA_ADMIN).emit(evento, dados);
}

/**
 * Avisa todos os envolvidos em um pedido, cada um com a sua visão dele.
 * `entregadorAnterior` é o id de quem estava com o pedido antes da mudança,
 * para a entrega sair da lista dele se o pedido trocou de mãos.
 */
export function avisarPedido(tipo, pedido, { entregadorAnterior = null } = {}) {
  if (!io) return;

  io.to(SALA_ADMIN).emit(`pedido:${tipo}`, pedidoParaPainel(pedido));
  io.to(salaDoCliente(pedido.clienteId)).emit(
    `meu-pedido:${tipo}`,
    pedidoParaCliente(pedido),
  );

  const atual = pedido.entregador?.id ?? null;
  if (atual) {
    const sala = io.to(salaDoEntregador(atual));
    if (pedido.status === "entrega") {
      sala.emit("entrega:salva", pedidoParaEntregador(pedido));
    } else {
      sala.emit("entrega:encerrada", { id: pedido.id, status: pedido.status });
    }
  }
  if (entregadorAnterior && entregadorAnterior !== atual) {
    io.to(salaDoEntregador(entregadorAnterior)).emit("entrega:encerrada", {
      id: pedido.id,
      status: "transferida",
    });
  }
}

/** A posição vai para o painel e para os clientes que ele está atendendo. */
export function avisarPosicao(entregadorId, posicao, pedidosNaRua) {
  if (!io) return;

  io.to(SALA_ADMIN).emit("entregador:posicao", { entregadorId, posicao });
  for (const pedido of pedidosNaRua) {
    io.to(salaDoCliente(pedido.clienteId)).emit("meu-pedido:posicao", {
      pedidoId: pedido.id,
      posicao,
    });
  }
}

/** Conta desativada ou excluída: derruba as conexões abertas dela. */
export function desconectarEntregador(entregadorId) {
  io?.in(salaDoEntregador(entregadorId)).disconnectSockets(true);
}
