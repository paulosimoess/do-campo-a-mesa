import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeilao } from '../hooks/useLeilao.js';
import { useContagem } from '../hooks/useContagem.js';

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export default function SalaLeilao() {
  const { id } = useParams();
  const { utilizador } = useAuth();

  const {
    leilao,
    atual,
    participantes,
    historico,
    resultado,
    offset,
    erro,
    aCarregar,
    licitar
  } = useLeilao(id);

  const [valor, setValor] = useState('');

  const contagem = useContagem(
    leilao?.estado === 'agendado'
      ? leilao.iniciaEm
      : leilao?.terminaEm,
    offset
  );

  if (aCarregar) {
    return (
      <section className="sala-leilao">
        <p>A carregar leilão...</p>
      </section>
    );
  }

  if (!leilao) {
    return (
      <section className="sala-leilao">
        <div>
          <h1>Leilão não encontrado</h1>
          <p>{erro || 'Não foi possível carregar o leilão.'}</p>
          <Link to="/leiloes" className="btn btn-outline-success">
            Voltar aos leilões
          </Link>
        </div>
      </section>
    );
  }

  const nomeProdutor =
    leilao.produtor?.produtor?.nomeExploracao ||
    leilao.produtor?.nome ||
    'Produtor';

  const localidade = leilao.produtor?.produtor?.localidade;

  const terminado = leilao.estado === 'terminado';
  const agendado = leilao.estado === 'agendado';
  const agora = Date.now() + offset;

  const ativoAgora =
    leilao.estado === 'ativo' &&
    new Date(leilao.iniciaEm).getTime() <= agora &&
    new Date(leilao.terminaEm).getTime() > agora &&
    contagem.restanteMs > 0;

  const precoAtual = atual?.valor ?? leilao.precoBase;

  const minimo = Math.round(
    (precoAtual + leilao.incremento) * 100
  ) / 100;

  const totalLicitacoes = leilao.numLicitacoes ?? historico.length;

  function preencherAtalho(aumento) {
    const valorIntroduzido = Number(valor);

    const valorBase =
      valor.trim() !== '' &&
      Number.isFinite(valorIntroduzido) &&
      valorIntroduzido >= minimo
        ? valorIntroduzido
        : minimo;

    const novoValor = Math.round(
      (valorBase + aumento) * 100
    ) / 100;

    setValor(novoValor.toFixed(2));
  }

  const valorNumerico = Number(valor);

  const valorValido =
    valor.trim() !== '' &&
    Number.isFinite(valorNumerico) &&
    valorNumerico >= minimo;

  function submeter(e) {
    e.preventDefault();

    if (valor.trim() === '') return;

    licitar(valorNumerico);
  }

  return (
    <section className="sala-leilao">
      <div className="sala-leilao__principal">
        <div className="sala-leilao__cabecalho">
          <p className="sala-leilao__etiqueta">
            {terminado
              ? 'LEILÃO TERMINADO'
              : agendado
                ? 'LEILÃO AGENDADO'
                : 'LEILÃO EM DIRETO'}
          </p>

          <h1>{leilao.lote}</h1>

          <p className="texto-secundario">
            {nomeProdutor}
            {localidade && ` · ${localidade}`}
          </p>

          <p className="texto-secundario small">
            {agendado ? 'Início' : 'Fim'}:{' '}
            {formatarData(
              agendado ? leilao.iniciaEm : leilao.terminaEm
            )}
          </p>
        </div>

        <div className="sala-leilao__imagem">
          <span>Imagem do lote</span>
        </div>

        <section className="historico-licitacoes">
          <div className="historico-licitacoes__cabecalho">
            <h2>Histórico de licitações</h2>

            <span className="texto-secundario">
              {totalLicitacoes} licitações
            </span>
          </div>

          <div className="historico-licitacoes__lista">
            {historico.length === 0 ? (
              <p className="texto-secundario">
                Ainda não existem licitações.
              </p>
            ) : (
              historico.map((licitacao) => (
                <div
                  key={licitacao._id}
                  className="historico-licitacoes__item"
                >
                  <span>
                    {licitacao.nome ||
                      licitacao.comprador?.nome ||
                      'Comprador'}
                  </span>

                  <strong>
                    {formatarPreco(licitacao.valor)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <aside className="sala-leilao__painel">
        <p className="sala-leilao__participantes">
          {utilizador
            ? `${participantes} a assistir`
            : 'Entre para acompanhar em direto'}
        </p>

        <p className="texto-secundario small mb-1">
          {terminado
            ? totalLicitacoes > 0
              ? 'Licitação final'
              : 'Preço base'
            : 'Licitação atual'}
        </p>

        <p className="sala-leilao__valor">
          {formatarPreco(precoAtual)}
        </p>

        {!terminado && (
          <div className="mt-3 mb-3">
            <p className="texto-secundario small mb-1">
              {agendado ? 'Começa em' : 'Tempo restante'}
            </p>

            <p
              className="fs-4 fw-bold mb-0"
              role="timer"
              aria-live="off"
            >
              {contagem.texto}
            </p>
          </div>
        )}

        {!terminado && (
          <p className="texto-secundario small">
            Incremento mínimo: {formatarPreco(leilao.incremento)}
          </p>
        )}

        {terminado ? (
          <div className="alert alert-info mt-3">
            {resultado?.vencedor ? (
              <>
                <strong>Leilão terminado!</strong>

                <p className="mb-1 mt-2">
                  Vencedor: {resultado.vencedor.nome || 'Comprador'}
                </p>

                <p className="mb-0">
                  Valor final: {formatarPreco(resultado.valor)}
                </p>
              </>
            ) : (
              <p className="mb-0">
                Leilão terminado sem vencedor.
              </p>
            )}
          </div>
        ) : agendado ? (
          <div className="alert alert-info mt-3">
            O leilão ainda não começou.
          </div>
        ) : utilizador?.papel === 'comprador' ? (
          ativoAgora ? (
            <form onSubmit={submeter}>
              <label htmlFor="valor" className="form-label">
                O seu valor (€)
              </label>

              <input
                id="valor"
                type="number"
                step="0.01"
                min={minimo}
                className="form-control mb-2"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={`Mínimo: ${minimo.toFixed(2)} €`}
                required
              />

              <div className="d-flex flex-wrap gap-2 mb-3">
                {[5, 10, 25].map((aumento) => (
                  <button
                    key={aumento}
                    type="button"
                    className="btn btn-outline-success btn-sm flex-fill"
                    onClick={() => preencherAtalho(aumento)}
                    aria-label={`Licitar mais ${aumento} euros sobre o valor atual`}
                  >
                    +{aumento} €
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary w-100 mb-3"
                onClick={() => setValor(minimo.toFixed(2))}
                disabled={Number(valor) === minimo}
              >
                ↺ Repor mínimo ({formatarPreco(minimo)})
              </button>

              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={!valorValido}
              >
                Licitar
              </button>
            </form>
          ) : (
            <p className="texto-secundario">
              O prazo para licitar já terminou.
            </p>
          )
        ) : utilizador ? (
          <p className="texto-secundario">
            Apenas compradores podem licitar.
          </p>
        ) : (
          <div>
            <p className="texto-secundario">
              Inicie sessão como comprador para participar.
            </p>

            <Link
              to="/login"
              className="btn btn-success w-100"
            >
              Iniciar sessão
            </Link>
          </div>
        )}

        {erro && (
          <div className="alert alert-warning mt-3 mb-0">
            {erro}
          </div>
        )}

        <Link
          to="/leiloes"
          className="btn btn-outline-secondary w-100 mt-3"
        >
          Voltar aos leilões
        </Link>
      </aside>
    </section>
  );
}
