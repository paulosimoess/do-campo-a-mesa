import { useMemo, useState } from 'react';

const leiloesSimulados = {
  '1': {
    id: '1',
    lote: '200 kg de kiwi Hayward, calibre A',
    produtor: 'Horta da Ribeira',
    localidade: 'Ponte de Lima',
    participantes: 8,
    licitacaoAtual: {
      valor: 312
    },
    historico: [
      { id: 1, utilizador: 'Comprador 3', valor: 312 },
      { id: 2, utilizador: 'Comprador 1', valor: 305 },
      { id: 3, utilizador: 'Comprador 5', valor: 298 }
    ]
  },
  '2': {
    id: '2',
    lote: 'Alvarinho 2025 · 60 garrafas',
    produtor: 'Quinta da Lameira',
    localidade: 'Monção',
    participantes: 5,
    licitacaoAtual: {
      valor: 540
    },
    historico: [
      { id: 1, utilizador: 'Comprador 2', valor: 540 },
      { id: 2, utilizador: 'Comprador 4', valor: 520 }
    ]
  },
  '3': {
    id: '3',
    lote: 'Castanha Longal · 150 kg',
    produtor: 'Souto da Serra',
    localidade: 'Melgaço',
    participantes: 3,
    licitacaoAtual: {
      valor: 410
    },
    historico: [
      { id: 1, utilizador: 'Comprador 1', valor: 410 }
    ]
  }
};

export function useLeilaoSimulado(id) {
  const leilao = useMemo(
    () => leiloesSimulados[id] || null,
    [id]
  );

  const [atual, setAtual] = useState(
    leilao?.licitacaoAtual || null
  );

  const [historico, setHistorico] = useState(
    leilao?.historico || []
  );

  const [erro, setErro] = useState('');

  const licitar = (valor) => {
    setErro('');

    if (!leilao) {
      setErro('Leilão não encontrado.');
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      setErro('Introduza um valor válido.');
      return;
    }

    if (atual && valor <= atual.valor) {
      setErro(
        `A licitação deve ser superior a ${atual.valor.toFixed(2)} €.`
      );
      return;
    }

    setAtual({
      valor
    });

    setHistorico((anterior) => [
      {
        id: Date.now(),
        utilizador: 'Você',
        valor
      },
      ...anterior
    ]);
  };

  return {
    leilao,
    atual,
    participantes: leilao?.participantes || 0,
    historico,
    erro,
    licitar
  };
}