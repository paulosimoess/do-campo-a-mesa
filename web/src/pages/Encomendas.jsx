import EstadoEncomenda from '../components/EstadoEncomenda.jsx';

const encomendasSimuladas = [
  {
    id: 'DCM-1024',
    produtor: 'Horta da Ribeira',
    data: '08/10/2026',
    total: '38,50 €',
    estado: 'pronta'
  },
  {
    id: 'DCM-1018',
    produtor: 'Quinta da Lameira',
    data: '04/10/2026',
    total: '54,20 €',
    estado: 'confirmada'
  },
  {
    id: 'DCM-1007',
    produtor: 'Souto da Serra',
    data: '29/09/2026',
    total: '27,80 €',
    estado: 'entregue'
  }
];

export default function Encomendas() {
  return (
    <section className="encomendas">
      <div className="encomendas__cabecalho">
        <div>
          <p className="encomendas__etiqueta">
            COMPRAS
          </p>

          <h1>As minhas encomendas</h1>

          <p className="texto-secundario">
            Acompanhe o estado das suas encomendas e consulte compras anteriores.
          </p>
        </div>
      </div>

      <div className="encomendas__lista">
        {encomendasSimuladas.map((encomenda) => (
          <article
            key={encomenda.id}
            className="encomenda-cartao"
          >
            <div className="encomenda-cartao__topo">
              <div>
                <p className="encomenda-cartao__numero">
                  #{encomenda.id}
                </p>

                <h2>{encomenda.produtor}</h2>
              </div>

              <div className="encomenda-cartao__resumo">
                <span>{encomenda.data}</span>
                <strong>{encomenda.total}</strong>
              </div>
            </div>

            <EstadoEncomenda estado={encomenda.estado} />

            {encomenda.estado === 'entregue' && (
              <div className="encomenda-cartao__acoes">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                >
                  Avaliar encomenda
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}