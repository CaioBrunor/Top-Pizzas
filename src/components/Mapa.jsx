import { Component, Suspense, lazy } from "react";

// O mapa (Leaflet) só é baixado por quem chega a uma tela que usa mapa.
const MapaLeaflet = lazy(() => import("./MapaLeaflet"));

// Se o mapa não carregar (sem internet na primeira vez, por exemplo), a tela
// em volta continua funcionando.
class SemMapa extends Component {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  render() {
    if (this.state.falhou) {
      return (
        <div className="mapa mapa--aviso">
          Não foi possível carregar o mapa agora.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Mapa(props) {
  return (
    <SemMapa>
      <Suspense
        fallback={<div className="mapa mapa--aviso">Carregando o mapa...</div>}
      >
        <MapaLeaflet {...props} />
      </Suspense>
    </SemMapa>
  );
}
