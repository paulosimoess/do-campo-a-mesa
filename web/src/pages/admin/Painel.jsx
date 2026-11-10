import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';

export default function PainelAdmin() {
  const { token } = useAuth();
  const socket = useSocket();

  const [produtoresPendentes, setProdutoresPendentes] = useState([]);
  const [erroProdutores, setErroProdutores] = useState('');
  const [aCarregarProdutores, setACarregarProdutores] = useState(true);
  const [avaliacoesDenunciadas, setAvaliacoesDenunciadas] = useState([]);
  const [erroAvaliacoes, setErroAvaliacoes] = useState('');
  const [aCarregarAvaliacoes, setACarregarAvaliacoes] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [erroEstatisticas, setErroEstatisticas] = useState('');
  const [leiloesAtivos, setLeiloesAtivos] = useState([]);
  const [erroLeiloes, setErroLeiloes] = useState('');
  const [aCarregarLeiloes, setACarregarLeiloes] = useState(true);

  useEffect(() => {
    async function carregarProdutoresPendentes() {
      try {
        setErroProdutores('');

        const dados = await api(
          '/admin/produtores/pendentes',
          { token }
        );

        setProdutoresPendentes(dados);
      } catch (err) {
        setErroProdutores(err.message);
      } finally {
        setACarregarProdutores(false);
      }
    }

    carregarProdutoresPendentes();
  }, [token]);

  async function validarProdutor(produtorId, aprovado) {
    try {
      setErroProdutores('');

      await api(
        `/admin/produtores/${produtorId}/validacao`,
        {
          metodo: 'PATCH',
          corpo: { aprovado },
          token
        }
      );

      setProdutoresPendentes((atuais) =>
        atuais.filter(
          (produtor) => produtor._id !== produtorId
        )
      );
    } catch (err) {
      setErroProdutores(err.message);
    }
  }

  useEffect(() => {
    async function carregarAvaliacoesDenunciadas() {
      try {
        setErroAvaliacoes('');

        const dados = await api(
          '/admin/reviews/denunciadas',
          { token }
        );

        setAvaliacoesDenunciadas(dados);
      } catch (err) {
        setErroAvaliacoes(err.message);
      } finally {
        setACarregarAvaliacoes(false);
      }
    }

    carregarAvaliacoesDenunciadas();
  }, [token]);

  async function moderarAvaliacao(avaliacaoId, visivel) {
    try {
      setErroAvaliacoes('');

      await api(
        `/admin/reviews/${avaliacaoId}`,
        {
          metodo: 'PATCH',
          corpo: {
            visivel
          },
          token
        }
      );

      setAvaliacoesDenunciadas((atuais) =>
        atuais.filter(
          (avaliacao) => avaliacao._id !== avaliacaoId
        )
      );
    } catch (err) {
      setErroAvaliacoes(err.message);
    }
  }

  useEffect(() => {
    async function carregarEstatisticas() {
      try {
        setErroEstatisticas('');

        const dados = await api(
          '/admin/estatisticas',
          { token }
        );

        setEstatisticas(dados);
      } catch (err) {
        setErroEstatisticas(err.message);
      }
    }

    carregarEstatisticas();
  }, [token]);

  useEffect(() => {
    let ativo = true;
    let pedidoAtual = 0;

    async function carregarLeiloesAtivos() {
      const pedido = ++pedidoAtual;

      try {
        const dados = await api('/auctions?estado=ativo');

        if (!ativo || pedido !== pedidoAtual) return;

        setLeiloesAtivos(dados);
        setErroLeiloes('');
      } catch (err) {
        if (ativo && pedido === pedidoAtual) {
          setErroLeiloes(err.message);
        }
      } finally {
        if (ativo && pedido === pedidoAtual) {
          setACarregarLeiloes(false);
        }
      }
    }

    carregarLeiloesAtivos();

    if (socket) {
      socket.on(
        'leiloes-admin-atualizados',
        carregarLeiloesAtivos
      );

      socket.on('connect', carregarLeiloesAtivos);
    }

    return () => {
      ativo = false;

      if (socket) {
        socket.off(
          'leiloes-admin-atualizados',
          carregarLeiloesAtivos
        );

        socket.off('connect', carregarLeiloesAtivos);
      }
    };
  }, [socket]);

  return (
    <section className="painel-admin">
      <div className="painel-admin__cabecalho">
        <div>
          <p className="painel-admin__etiqueta">
            ÁREA DE ADMINISTRAÇÃO
          </p>

          <h1>Administração</h1>

          <p className="texto-secundario">
            Acompanhe a atividade global da plataforma e trate das tarefas de moderação.
          </p>
        </div>
      </div>

      <div className="painel-admin__indicadores">
        <article className="painel-indicador">
          <span>Utilizadores</span>
          <strong>
            {estatisticas?.utilizadores ?? '—'}
          </strong>
          <small>
            {estatisticas?.produtores ?? '—'} produtores
          </small>
        </article>

        <article className="painel-indicador">
          <span>Encomendas hoje</span>
          <strong>
            {estatisticas?.encomendasHoje ?? '—'}
          </strong>
          <small>
            Criadas desde as 00:00
          </small>
        </article>

        <article className="painel-indicador">
          <span>Leilões ativos</span>
          <strong>
            {estatisticas?.leiloesAtivos ?? '—'}
          </strong>
          <small>
            Em direto
          </small>
        </article>

        <article className="painel-indicador">
          <span>Avaliações denunciadas</span>
          <strong>
            {avaliacoesDenunciadas.length}
          </strong>
          <small>
            A aguardar moderação
          </small>
        </article>
      </div>

      {erroEstatisticas && (
        <div className="alert alert-danger">
          {erroEstatisticas}
        </div>
      )}
      
      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              VALIDAÇÃO
            </p>

            <h2>Produtores por validar</h2>
          </div>

          <span className="admin-bloco__contador">
            {produtoresPendentes.length} pedidos
          </span>
        </div>

        {aCarregarProdutores && (
          <p className="texto-secundario">
            A carregar produtores...
          </p>
        )}

        {erroProdutores && (
          <div className="alert alert-danger">
            {erroProdutores}
          </div>
        )}

        {!aCarregarProdutores &&
          !erroProdutores &&
          produtoresPendentes.length === 0 && (
            <p className="texto-secundario">
              Não existem produtores pendentes de validação.
            </p>
          )}

        <div className="admin-lista">
          {produtoresPendentes.map((produtor) => (
            <article
              key={produtor._id}
              className="admin-lista__item"
            >
              <div>
                <h3>
                  {produtor.produtor?.nomeExploracao ||
                    produtor.nome}
                </h3>

                <p className="texto-secundario mb-0">
                  {produtor.produtor?.localidade ||
                    'Localidade não indicada'}
                  {' · '}
                  {produtor.email}
                </p>
              </div>

              <div className="admin-lista__acoes">
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={() =>
                    validarProdutor(produtor._id, true)
                  }
                >
                  Aprovar
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() =>
                    validarProdutor(produtor._id, false)
                  }
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              MODERAÇÃO
            </p>

            <h2>Avaliações denunciadas</h2>
          </div>

          <span className="admin-bloco__contador">
            {avaliacoesDenunciadas.length} por moderar
          </span>
        </div>

        {aCarregarAvaliacoes && (
          <p className="texto-secundario">
            A carregar avaliações...
          </p>
        )}

        {erroAvaliacoes && (
          <div className="alert alert-danger">
            {erroAvaliacoes}
          </div>
        )}

        {!aCarregarAvaliacoes &&
          !erroAvaliacoes &&
          avaliacoesDenunciadas.length === 0 && (
            <p className="texto-secundario">
              Não existem avaliações denunciadas.
            </p>
          )}

        <div className="admin-lista">
          {avaliacoesDenunciadas.map((avaliacao) => (
            <article
              key={avaliacao._id}
              className="admin-lista__item"
            >
              <div>
                <h3>
                  {avaliacao.classificacao}/5 ·{' '}
                  {avaliacao.autor?.nome || 'Utilizador'}
                </h3>

                <p className="mb-1">
                  “{avaliacao.comentario}”
                </p>

                <p className="texto-secundario mb-0">
                  Sobre{' '}
                  {avaliacao.produtor?.produtor?.nomeExploracao ||
                    avaliacao.produtor?.nome ||
                    'Produtor'}
                </p>
              </div>

              <div className="admin-lista__acoes">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() =>
                    moderarAvaliacao(
                      avaliacao._id,
                      true
                    )
                  }
                >
                  Manter
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() =>
                    moderarAvaliacao(
                      avaliacao._id,
                      false
                    )
                  }
                >
                  Ocultar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              TEMPO REAL
            </p>

            <h2>Leilões ativos</h2>
          </div>

          <span className="admin-bloco__contador">
            {leiloesAtivos.length} em direto
          </span>
        </div>

        {aCarregarLeiloes && (
          <p className="texto-secundario">
            A carregar leilões...
          </p>
        )}

        {erroLeiloes && (
          <div className="alert alert-danger">
            {erroLeiloes}
          </div>
        )}

        {!aCarregarLeiloes &&
          !erroLeiloes &&
          leiloesAtivos.length === 0 && (
            <p className="texto-secundario">
              Não existem leilões ativos.
            </p>
          )}

        <div className="admin-lista">
          {leiloesAtivos.map((leilao) => (
            <article
              key={leilao._id}
              className="admin-lista__item"
            >
              <div>
                <h3>
                  {leilao.titulo ||
                    leilao.produto?.nome ||
                    'Leilão'}
                </h3>

                <p className="texto-secundario mb-1">
                  {leilao.produtor?.produtor?.nomeExploracao ||
                    leilao.produtor?.nome ||
                    'Produtor'}
                </p>

                <p className="mb-0">
                  Licitação atual:{' '}
                  <strong>
                    {Number(
                      leilao.licitacaoAtual?.valor ??
                      leilao.precoBase ??
                      0
                    ).toFixed(2)} €
                  </strong>
                </p>
              </div>

              <div className="text-md-end">
                <span className="texto-secundario small">
                  Estado
                </span>

                <p className="fw-bold mb-0">
                  {leilao.estado}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}