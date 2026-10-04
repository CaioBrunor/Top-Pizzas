const RAIO_DA_TERRA = 6371000;
const emRadianos = (graus) => (graus * Math.PI) / 180;

/** Distância em linha reta entre dois pontos { lat, lng }, em metros. */
export function distanciaEmMetros(a, b) {
  const dLat = emRadianos(b.lat - a.lat);
  const dLng = emRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(a.lat)) *
      Math.cos(emRadianos(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_DA_TERRA * Math.asin(Math.sqrt(h));
}
