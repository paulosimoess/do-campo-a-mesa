import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeilaoSimulado } from '../hooks/useLeilaoSimulado.js';

export default function SalaLeilao() {
  const { id } = useParams();
  const { utilizador } = useAuth();

  const {
    leilao,
    atual,
    participantes,
    historico,
    erro,
    licitar
  } = useLeilaoSimulado(id);

  const [valor, setValor] = useState('');

  if (!leilao) {
    return (
      <section>
        <h1>Leilão não encontrado</h1>
      </section>
    );
  }

  function submeter(e) {
    e.preventDefault();

    licitar(Number(valor));
  }

  return (
    <section className="sala-leilao">
      <div className="sala-leilao__principal">
        <div className="sala-leilao__cabecalho">
          <p className="sala-leilao__etiqueta">
            LEILÃO EM DIRETO
          </p>

          <h1>{leilao.lote}</h1>

          <p className="texto-secundario">
            {leilao.produtor} · {leilao.localidade}
          </p>
        </div>

        <div className="sala-leilao__imagem">
          <span>Imagem do lote</span>
        </div>

        <section className="historico-licitacoes">
          <div className="historico-licitacoes__cabecalho">
            <h2>Histórico de licitações</h2>

            <span className="texto-secundario">
              {historico.length} licitações
            </span>
          </div>

          <div className="historico-licitacoes__lista">
            {historico.map((licitacao) => (
              <div
                key={licitacao.id}
                className="historico-licitacoes__item"
              >
                <span>{licitacao.utilizador}</span>

                <strong>
                  {licitacao.valor.toFixed(2)} €
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="sala-leilao__painel">
        <p className="sala-leilao__participantes">
          {participantes} a assistir
        </p>

        <p className="texto-secundario small mb-1">
          Licitação atual
        </p>

        <p className="sala-leilao__valor">
          {atual?.valor != null
            ? `${atual.valor.toFixed(2)} €`
            : '—'}
        </p>

        {utilizador?.papel === 'comprador' ? (
          <form onSubmit={submeter}>
            <label
              htmlFor="valor"
              className="form-label"
            >
              O seu valor (€)
            </label>

            <input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              className="form-control mb-2"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn btn-success w-100"
            >
              Licitar
            </button>
          </form>
        ) : (
          <p className="texto-secundario mb-0">
            Apenas compradores podem licitar.
          </p>
        )}

        {erro && (
          <div className="alert alert-warning mt-3 mb-0">
            {erro}
          </div>
        )}
      </aside>
    </section>
  );
}