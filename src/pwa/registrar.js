import { useSyncExternalStore } from "react";

// Estado do PWA fora do React: o navegador pode oferecer a instalação antes
// de qualquer componente existir.
let estado = { instalavel: false, atualizacaoPronta: false };
let registro = null;
let conviteDeInstalacao = null;

const ouvintes = new Set();

function mudar(parte) {
  estado = { ...estado, ...parte };
  ouvintes.forEach((fn) => fn());
}

function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export const usePwa = () => useSyncExternalStore(assinar, () => estado);

async function registrar() {
  try {
    registro = await navigator.serviceWorker.register("/sw.js");
  } catch (erro) {
    console.warn("Não foi possível ativar o modo offline:", erro);
    return;
  }

  // Havendo um service worker no comando da página, um novo que termina de
  // instalar é uma versão nova do site esperando para entrar.
  const conferirEspera = () => {
    if (registro.waiting && navigator.serviceWorker.controller) {
      mudar({ atualizacaoPronta: true });
    }
  };

  conferirEspera();
  registro.addEventListener("updatefound", () => {
    registro.installing?.addEventListener("statechange", conferirEspera);
  });

  // App instalado fica aberto por dias: procura versão nova ao voltar para ele.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      registro.update().catch(() => {});
    }
  });
}

export function prepararPwa() {
  window.addEventListener("beforeinstallprompt", (evento) => {
    // Guarda o convite do navegador para mostrar no botão "Instalar".
    evento.preventDefault();
    conviteDeInstalacao = evento;
    mudar({ instalavel: true });
  });

  window.addEventListener("appinstalled", () => {
    conviteDeInstalacao = null;
    mudar({ instalavel: false });
  });

  if (!("serviceWorker" in navigator)) return;

  // No desenvolvimento o cache do service worker brigaria com o Vite, então
  // ele só existe no build. Um que tenha sobrado de um teste é removido.
  if (!import.meta.env.PROD) {
    navigator.serviceWorker
      .getRegistrations()
      .then((lista) => lista.forEach((r) => r.unregister()))
      .catch(() => {});
    return;
  }

  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true });
}

export async function instalarApp() {
  if (!conviteDeInstalacao) return;
  const convite = conviteDeInstalacao;
  conviteDeInstalacao = null;
  mudar({ instalavel: false });

  convite.prompt();
  await convite.userChoice.catch(() => {});
}

export function aplicarAtualizacao() {
  if (!registro?.waiting) return;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true },
  );
  registro.waiting.postMessage({ tipo: "ATIVAR_AGORA" });
}

/**
 * Pede ao service worker para guardar as fotos do cardápio, para elas
 * aparecerem offline mesmo que a pessoa não tenha rolado a página até elas.
 */
export function guardarFotos(urls) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  if (urls.length === 0 || navigator.connection?.saveData) return;

  navigator.serviceWorker.ready
    .then((r) => r.active?.postMessage({ tipo: "GUARDAR_FOTOS", urls }))
    .catch(() => {});
}
