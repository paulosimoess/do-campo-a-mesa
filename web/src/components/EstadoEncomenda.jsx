
const ESTADOS = [
  'pendente',
  'confirmada',
  'pronta',
  'entregue'
];

const ICONES = {
  pendente: '⏳',
  confirmada: '✅',
  pronta: '📦',
  entregue: '🚚'
};

export default function EstadoEncomenda({ estado }) {
  const indiceAtual = ESTADOS.indexOf(estado);

  return (
    <ol
      className="estado-encomenda"
      aria-label={`Estado da encomenda: ${estado}`}
    >
      {ESTADOS.map((etapa, indice) => {
        const concluida = indice < indiceAtual;
        const atual = indice === indiceAtual;

        return (
          <li
            key={etapa}
            className={
              concluida ? 'feito' : atual ? 'atual' : ''
            }
            aria-current={atual ? 'step' : undefined}
          >
            {(concluida || atual) && (
              <span aria-hidden="true">
                {concluida ? '✓' : ICONES[etapa]}
              </span>
            )}

            <span>{etapa}</span>
          </li>
        );
      })}
    </ol>
  );
}
