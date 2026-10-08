import { useEffect, useState } from "react";

export function useAgora(intervalo = 10_000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);

  return agora;
}
