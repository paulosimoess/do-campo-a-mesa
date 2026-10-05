// Produtor: painel de gestão
import { Link } from 'react-router-dom';

const indicadores = [
  {
    titulo: 'Vendas este mês',
    valor: '1 284 €',
    detalhe: '+15% face a setembro'
  },
  {
    titulo: 'Encomendas por tratar',
    valor: '4',
    detalhe: '2 pendentes'
  },
  {
    titulo: 'Produtos ativos',
    valor: '12',
    detalhe: '3 com stock baixo'
  },
  {
    titulo: 'Avaliação média',
    valor: '4,7',
    detalhe: '51 avaliações'
  }
];

export default function PainelProdutor() {
  return (
    <section className="painel-produtor">
      <div className="painel-produtor__cabecalho">
        <div>
          <p className="painel-produtor__etiqueta">
            ÁREA DO PRODUTOR
          </p>

          <h1>Painel do produtor</h1>

          <p className="texto-secundario">
            Acompanhe a atividade da sua exploração e faça a gestão dos seus produtos.
          </p>
        </div>

        <div className="painel-produtor__acoes">
          <Link
            to="/produtor/produtos"
            className="btn btn-outline-secondary"
          >
            Gerir produtos
          </Link>

          <Link
            to="/produtor/leiloes/novo"
            className="btn btn-success"
          >
            Criar leilão
          </Link>
        </div>
      </div>

      <div className="painel-produtor__indicadores">
        {indicadores.map((indicador) => (
          <article
            key={indicador.titulo}
            className="painel-indicador"
          >
            <span>{indicador.titulo}</span>

            <strong>{indicador.valor}</strong>

            <small>{indicador.detalhe}</small>
          </article>
        ))}
      </div>
    </section>
  );
}