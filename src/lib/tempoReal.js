import { useSyncExternalStore } from "react";
import { io } from "socket.io-client";
import { URL_API } from "./api";
import { aoMudarSessao, lerSessao } from "./sessao";

const tokens = () => ({
  tokenCliente: lerSessao("cliente")?.token ?? null,
  tokenAdmin: lerSessao("admin")?.token ?? null,
  tokenEntregador: lerSessao("entregador")?.token ?? null,
});

// Uma conexão por aba. O site só escuta: o servidor decide o que cada conexão
// recebe a partir dos tokens enviados na abertura.
export const socket = io(URL_API || undefined, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  tryAllTransports: true,
  reconnectionDelayMax: 10_000,
  auth: (enviar) => enviar(tokens()),
});

let iniciado = false;

export function iniciarTempoReal() {
  if (iniciado) return;
  iniciado = true;

  let enviados = JSON.stringify(tokens());
  socket.connect();

  // Entrou ou saiu de uma conta: reconecta para o servidor rever o que esta
  // aba pode receber.
  aoMudarSessao(() => {
    const atuais = JSON.stringify(tokens());
    if (atuais === enviados) return;
    enviados = atuais;
    socket.disconnect().connect();
  });

  // O servidor derruba a conexão quando um token vence. Volta sem ele.
  socket.on("disconnect", (motivo) => {
    if (motivo === "io server disconnect") socket.connect();
  });
}

function assinarConexao(fn) {
  socket.on("connect", fn);
  socket.on("disconnect", fn);
  return () => {
    socket.off("connect", fn);
    socket.off("disconnect", fn);
  };
}

export const useAoVivo = () =>
  useSyncExternalStore(assinarConexao, () => socket.connected);

function assinarRede(fn) {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

export const useOnline = () =>
  useSyncExternalStore(assinarRede, () => navigator.onLine);
