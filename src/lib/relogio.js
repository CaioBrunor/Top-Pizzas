import { useEffect, useState } from "react";

/**
 * A hora atual, renovada a cada `intervalo` ms. Serve para textos como
 * "atualizado há 40 s" continuarem certos sem ninguém mexer na tela.
 */
export function useAgora(intervalo = 10_000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);

  return agora;
}
