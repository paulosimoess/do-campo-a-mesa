
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const etiquetasEstado = {
  ativo: 'EM DIRETO',
  agendado: 'AGENDADO',
  terminado: 'TERMINADO'
};

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

export default function Leiloes() {
  const [leiloes, setLeiloes] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarLeiloes() {
      try {
        const dados = await api('/auctions');

        if (ativo) {
          setLeiloes(dados);
        }
      } catch (err) {
        if (ativo) {
          setErro(err.message || 'Erro ao carregar leilões.');
        }
      } finally {
        if (ativo) {
          setACarregar(false);
        }
      }
    }

    carregarLeiloes();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="leiloes">
      <div className="leiloes__cabecalho">
        <div>
          <p className="leiloes__etiqueta">
            LEILÕES
          </p>

          <h1>Leilões de produtores locais</h1>

          <p className="texto-secundario">
            Acompanhe lotes sazonais e excedentes
            diretamente dos produtores.
          </p>
        </div>
      </div>

      {aCarregar && (
        <p className="texto-secundario">
          A carregar leilões...
        </p>
      )}

      {erro && (
        <div className="alert alert-danger">
          {erro}
        </div>
      )}

      {!aCarregar && !erro && leiloes.length === 0 && (
        <p className="texto-secundario">
          Ainda não existem leilões disponíveis.
        </p>
      )}

      <div className="leiloes__grelha">
        {leiloes.map((leilao) => {
          const produtor = leilao.produtor;

          const nomeProdutor =
            produtor?.produtor?.nomeExploracao ||
            produtor?.nome ||
            'Produtor';

          const localidade =
            produtor?.produtor?.localidade;

          const precoAtual =
            leilao.licitacaoAtual?.valor ??
            leilao.precoBase;

          const dataReferencia =
            leilao.estado === 'agendado'
              ? leilao.iniciaEm
              : leilao.terminaEm;

          return (
            <article
              key={leilao._id}
              className="leilao-cartao"
            >
              <div className="leilao-cartao__topo">
                <span
                  className={`leilao-cartao__estado leilao-cartao__estado--${leilao.estado}`}
                >
                  {etiquetasEstado[leilao.estado] || leilao.estado}
                </span>

                <span className="texto-secundario small">
                  {formatarData(dataReferencia)}
                </span>
              </div>

              <h2>{leilao.lote}</h2>

              <p className="texto-secundario">
                {nomeProdutor}
                {localidade && ` · ${localidade}`}
              </p>

              <div className="leilao-cartao__valor">
                <span>Licitação atual</span>

                <strong>
                  {formatarPreco(precoAtual)}
                </strong>
              </div>

              <Link
                to={`/leiloes/${leilao._id}`}
                className="btn btn-success w-100"
              >
                Ver leilão
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
