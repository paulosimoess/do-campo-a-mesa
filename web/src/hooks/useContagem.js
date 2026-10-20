
import { useEffect, useState } from 'react';

export function useContagem(dataAlvo, offset = 0) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    setAgora(Date.now());

    const intervalo = setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => clearInterval(intervalo);
  }, [dataAlvo, offset]);

  if (!dataAlvo) {
    return {
      texto: '--:--:--',
      restanteMs: 0
    };
  }

  const alvo = new Date(dataAlvo).getTime();

  if (!Number.isFinite(alvo)) {
    return {
      texto: '--:--:--',
      restanteMs: 0
    };
  }

  const restanteMs = Math.max(
    0,
    alvo - (agora + offset)
  );

  const segundosTotais = Math.ceil(restanteMs / 1000);

  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;

  const formatar = (numero) =>
    String(numero).padStart(2, '0');

  return {
    texto: [
      formatar(horas),
      formatar(minutos),
      formatar(segundos)
    ].join(':'),
    restanteMs
  };
}
