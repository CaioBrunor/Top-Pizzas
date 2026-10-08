import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MOSAICO = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CREDITO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const svg = (caminhos) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminhos}</svg>`;

const DESENHOS = {
  entregador: svg(
    '<circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h7l-3-7H8M14 10h4l1.5 4M6 7h4"/>',
  ),
  loja: svg(
    '<path d="M12 3l9 17a24 24 0 0 1-18 0L12 3z"/><circle cx="12" cy="12" r="1"/><circle cx="9.5" cy="16" r="1"/><circle cx="14.5" cy="16" r="1"/>',
  ),
};

// O rótulo vem de dados cadastrados (nome do entregador), então entra como
// texto, nunca como HTML.
function criarPino({ tipo, rotulo }) {
  const pino = document.createElement("div");
  pino.className = `mapa__pino mapa__pino--${tipo}`;
  pino.innerHTML = DESENHOS[tipo] ?? "";
  if (rotulo) {
    const texto = document.createElement("span");
    texto.className = "mapa__rotulo";
    texto.textContent = rotulo;
    pino.append(texto);
  }
  return L.divIcon({
    html: pino,
    className: "mapa__marcador",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const METROS_POR_GRAU = 111_320;

// A região de destino: um círculo tracejado com o nome do bairro na borda de
// cima, para o nome não cobrir o entregador quando ele chega.
function desenharArea(area, mapa) {
  const nome = document.createElement("span");
  nome.className = "mapa__area-rotulo";
  nome.textContent = area.rotulo;

  const circulo = L.circle([area.lat, area.lng], {
    radius: area.raio,
    className: "mapa__area",
    interactive: false,
  }).addTo(mapa);
  const rotulo = L.marker(
    [area.lat + area.raio / METROS_POR_GRAU, area.lng],
    {
      icon: L.divIcon({ html: nome, className: "mapa__marcador", iconSize: [0, 0] }),
      interactive: false,
      keyboard: false,
    },
  ).addTo(mapa);

  return {
    remover() {
      circulo.remove();
      rotulo.remove();
    },
  };
}

/**
 * Mapa com pinos que se movem.
 *
 * - `pontos`: [{ id, tipo: "entregador" | "loja", lat, lng, rotulo }]
 * - `area`: { lat, lng, raio, rotulo } para marcar uma região (o bairro de
 *   destino), quando não há um ponto exato.
 */
export default function MapaLeaflet({ pontos, area = null, rotulo = "Mapa" }) {
  const caixaRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadoresRef = useRef(new Map());
  const areaRef = useRef(null);
  const enquadradoRef = useRef("");

  useEffect(() => {
    const mapa = L.map(caixaRef.current, {
      scrollWheelZoom: false,
      // Sem animação de zoom: se a tela fecha no meio de uma, o Leaflet
      // tenta terminar a animação em um mapa que não existe mais.
      zoomAnimation: false,
      attributionControl: true,
    });
    mapa.attributionControl.setPrefix(false);
    L.tileLayer(MOSAICO, { attribution: CREDITO, maxZoom: 19 }).addTo(mapa);
    mapaRef.current = mapa;

    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(caixaRef.current);

    const marcadores = marcadoresRef.current;
    return () => {
      observador.disconnect();
      mapa.remove();
      mapaRef.current = null;
      areaRef.current = null;
      marcadores.clear();
      enquadradoRef.current = "";
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const marcadores = marcadoresRef.current;

    for (const [id, marcador] of marcadores) {
      if (!pontos.some((p) => p.id === id)) {
        marcador.remove();
        marcadores.delete(id);
      }
    }
    for (const ponto of pontos) {
      const existente = marcadores.get(ponto.id);
      if (existente) {
        existente.setLatLng([ponto.lat, ponto.lng]);
      } else {
        const marcador = L.marker([ponto.lat, ponto.lng], {
          icon: criarPino(ponto),
          keyboard: false,
          zIndexOffset: ponto.tipo === "entregador" ? 500 : 0,
        }).addTo(mapa);
        marcadores.set(ponto.id, marcador);
      }
    }

    const chaveDaArea = area
      ? `${area.lat}|${area.lng}|${area.raio}|${area.rotulo}`
      : "";
    if (areaRef.current?.chave !== chaveDaArea) {
      areaRef.current?.desenho.remover();
      areaRef.current = area
        ? { chave: chaveDaArea, desenho: desenharArea(area, mapa) }
        : null;
    }

    const cantos = [
      ...pontos.map((p) => [p.lat, p.lng]),
      ...(area ? [[area.lat, area.lng]] : []),
    ];
    if (cantos.length === 0) return;

    // Reenquadra quando muda quem aparece no mapa. Se só a posição mudou, o
    // mapa fica onde a pessoa deixou, a menos que um pino saia da vista.
    const quem = [...pontos.map((p) => p.id), chaveDaArea].join("|");
    if (enquadradoRef.current === quem) {
      const vista = mapa.getBounds().pad(-0.08);
      if (cantos.every((c) => vista.contains(c))) return;
    }

    enquadradoRef.current = quem;
    if (cantos.length === 1) mapa.setView(cantos[0], 15);
    else mapa.fitBounds(cantos, { padding: [36, 36], maxZoom: 16 });
  }, [pontos, area]);

  return <div ref={caixaRef} className="mapa" role="region" aria-label={rotulo} />;
}
