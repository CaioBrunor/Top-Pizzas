import { Component, Suspense, lazy } from "react";

const MapaLeaflet = lazy(() => import("./MapaLeaflet"));

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
