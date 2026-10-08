/* Service worker do Top Pizzas: é ele que faz o site abrir sem internet.
 *
 * No `npm run build`, o Vite coloca no topo deste arquivo a lista dos arquivos
 * principais do site (página, JavaScript, CSS, ícones) e um código de versão:
 *
 *   self.__PWA__ = { versao: "a1b2c3", arquivos: ["/index.html", ...] };
 *
 * Como o conteúdo do arquivo muda a cada build, o navegador percebe a versão
 * nova sozinho.
 */

const { versao = "dev", arquivos = ["/index.html"] } = self.__PWA__ ?? {};

const CACHE_PRINCIPAL = `top-pizzas-principal-${versao}`;
const CACHE_FOTOS = "top-pizzas-fotos-v1";
const CACHE_FONTES = "top-pizzas-fontes-v1";
const LIMITE_DE_FOTOS = 80;

const PAGINA = "/index.html";
const PRINCIPAIS = new Set(arquivos);

// Instalação: baixa e guarda os arquivos principais. Se um deles falhar, a
// instalação inteira falha e o navegador tenta de novo depois, então nunca
// fica um cache pela metade.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_PRINCIPAL)
      .then((cache) =>
        cache.addAll(arquivos.map((url) => new Request(url, { cache: "reload" }))),
      ),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((n) => n.startsWith("top-pizzas-principal-") && n !== CACHE_PRINCIPAL)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data?.tipo === "ATIVAR_AGORA") self.skipWaiting();
  if (evento.data?.tipo === "GUARDAR_FOTOS") {
    evento.waitUntil(guardarFotos(evento.data.urls));
  }
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const doSite = url.origin === self.location.origin;

  // A API e o tempo real vão sempre direto para a rede. Os dados que precisam
  // existir offline (cardápio, pedidos, conta) o próprio site guarda no
  // localStorage.
  if (doSite && /^\/(api|socket\.io)\//.test(url.pathname)) return;

  if (request.mode === "navigate") {
    if (doSite && !/\.[a-z0-9]+$/i.test(url.pathname)) {
      evento.respondWith(paginaDoSite(request));
    }
    return;
  }

  if (doSite && PRINCIPAIS.has(url.pathname)) {
    evento.respondWith(doCacheOuDaRede(request, CACHE_PRINCIPAL));
  } else if (doSite && request.destination === "image") {
    evento.respondWith(doCacheEAtualiza(evento, CACHE_FOTOS));
  } else if (url.origin === "https://fonts.googleapis.com") {
    evento.respondWith(doCacheEAtualiza(evento, CACHE_FONTES));
  } else if (url.origin === "https://fonts.gstatic.com") {
    evento.respondWith(doCacheOuDaRede(request, CACHE_FONTES));
  }
});

async function paginaDoSite(request) {
  const guardada = await caches.match(PAGINA, { cacheName: CACHE_PRINCIPAL });
  if (guardada) return guardada;

  try {
    return await fetch(request);
  } catch {
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>Top Pizzas</title>" +
        "<p style='font-family:sans-serif;padding:2rem'>Sem conexão. Abra o site uma vez com internet para ele funcionar offline.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

const podeGuardar = (resposta) => resposta.ok || resposta.type === "opaque";

async function doCacheOuDaRede(request, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);
  const guardada = await cache.match(request, { ignoreVary: true });
  if (guardada) return guardada;

  const resposta = await fetch(request);
  if (podeGuardar(resposta)) cache.put(request, resposta.clone());
  return resposta;
}

async function doCacheEAtualiza(evento, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);
  const guardada = await cache.match(evento.request, { ignoreVary: true });

  const daRede = fetch(evento.request).then(async (resposta) => {
    if (podeGuardar(resposta)) {
      await cache.put(evento.request, resposta.clone());
      if (nomeDoCache === CACHE_FOTOS) await limitarFotos(cache);
    }
    return resposta;
  });

  if (!guardada) return daRede;
  evento.waitUntil(daRede.catch(() => {}));
  return guardada;
}

// As mais antigas saem primeiro, para o cache não crescer sem limite.
async function limitarFotos(cache) {
  const chaves = await cache.keys();
  const sobra = chaves.length - LIMITE_DE_FOTOS;
  for (let i = 0; i < sobra; i += 1) await cache.delete(chaves[i]);
}

async function guardarFotos(urls) {
  if (!Array.isArray(urls)) return;
  const cache = await caches.open(CACHE_FOTOS);

  for (const url of urls.slice(0, LIMITE_DE_FOTOS)) {
    try {
      const destino = new URL(url, self.location.origin);
      if (destino.origin !== self.location.origin) continue;
      if (await cache.match(destino.href, { ignoreVary: true })) continue;

      const resposta = await fetch(destino.href);
      if (resposta.ok) await cache.put(destino.href, resposta);
    } catch {
      // Sem rede ou foto inexistente: fica para a próxima.
    }
  }
}
