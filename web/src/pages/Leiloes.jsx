import { Link } from 'react-router-dom';

const leiloesSimulados = [
  {
    id: '1',
    lote: '200 kg de kiwi Hayward, calibre A',
    produtor: 'Horta da Ribeira',
    localidade: 'Ponte de Lima',
    estado: 'ativo',
    licitacaoAtual: '312,00 €',
    terminaEm: '02:47'
  },
  {
    id: '2',
    lote: 'Alvarinho 2025 · 60 garrafas',
    produtor: 'Quinta da Lameira',
    localidade: 'Monção',
    estado: 'ativo',
    licitacaoAtual: '540,00 €',
    terminaEm: '11:52'
  },
  {
    id: '3',
    lote: 'Castanha Longal · 150 kg',
    produtor: 'Souto da Serra',
    localidade: 'Melgaço',
    estado: 'agendado',
    licitacaoAtual: '410,00 €',
    terminaEm: 'Hoje · 21:00'
  }
];

export default function Leiloes() {
  return (
    <section className="leiloes">
      <div className="leiloes__cabecalho">
        <div>
          <p className="leiloes__etiqueta">
            LEILÕES
          </p>

          <h1>Lotes em direto e agendados</h1>

          <p className="texto-secundario">
            Acompanhe lotes sazonais e excedentes diretamente dos produtores.
          </p>
        </div>
      </div>

      <div className="leiloes__grelha">
        {leiloesSimulados.map((leilao) => (
          <article
            key={leilao.id}
            className="leilao-cartao"
          >
            <div className="leilao-cartao__topo">
              <span
                className={`leilao-cartao__estado leilao-cartao__estado--${leilao.estado}`}
              >
                {leilao.estado === 'ativo' ? 'EM DIRETO' : 'AGENDADO'}
              </span>

              <span className="texto-secundario small">
                {leilao.terminaEm}
              </span>
            </div>

            <h2>{leilao.lote}</h2>

            <p className="texto-secundario">
              {leilao.produtor} · {leilao.localidade}
            </p>

            <div className="leilao-cartao__valor">
              <span>Licitação atual</span>
              <strong>{leilao.licitacaoAtual}</strong>
            </div>

            <Link
              to={`/leiloes/${leilao.id}`}
              className="btn btn-success w-100"
            >
              Ver leilão
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}