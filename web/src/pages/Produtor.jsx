import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL, api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const euro = (valor) =>
  Number(valor || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

function Estrelas({ classificacao }) {
  const valor = Number(classificacao);

  return (
    <span
      className="text-warning"
      role="img"
      aria-label={`${valor} de 5 estrelas`}
    >
      {'★'.repeat(valor)}
      {'☆'.repeat(5 - valor)}
    </span>
  );
}


function CartaoAvaliacao({ avaliacao, tipo }) {
  const { token } = useAuth();

  const [aDenunciar, setADenunciar] = useState(false);
  const [denunciada, setDenunciada] = useState(false);
  const [erroDenuncia, setErroDenuncia] = useState('');

  async function denunciarAvaliacao() {
    if (!token || aDenunciar || denunciada) return;

    try {
      setADenunciar(true);
      setErroDenuncia('');

      await api(`/reviews/${avaliacao._id}/denuncia`, {
        metodo: 'POST',
        token
      });

      setDenunciada(true);
    } catch (err) {
      setErroDenuncia(err.message);
    } finally {
      setADenunciar(false);
    }
  }

  return (
    <article className="border rounded-3 p-3 bg-white">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div>
          <strong>
            {tipo === 'produto'
              ? avaliacao.produto?.nome || 'Produto'
              : 'Avaliação do produtor'}
          </strong>

          <p className="texto-secundario small mb-0">
            Por {avaliacao.autor?.nome || 'Comprador'}
          </p>
        </div>

        <div className="text-end">
          <Estrelas
            classificacao={avaliacao.classificacao}
          />

          <p className="texto-secundario small mb-0">
            {avaliacao.classificacao}/5
          </p>
        </div>
      </div>

      {avaliacao.comentario && (
        <p className="mb-2">
          {avaliacao.comentario}
        </p>
      )}

      {token && (
        <div className="d-flex justify-content-end mt-2">
          {denunciada ? (
            <span
              className="texto-secundario small"
              role="status"
            >
              Denúncia enviada para moderação
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={denunciarAvaliacao}
              disabled={aDenunciar}
            >
              {aDenunciar
                ? 'A enviar...'
                : 'Denunciar avaliação'}
            </button>
          )}
        </div>
      )}

      {erroDenuncia && (
        <p
          className="text-danger small mt-2 mb-0"
          role="alert"
        >
          {erroDenuncia}
        </p>
      )}
    </article>
  );
}


export default function Produtor() {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setACarregar(true);
      setErro('');

      try {
        const [detalhes, listaAvaliacoes] = await Promise.all([
          api(`/producers/${id}`),
          api(`/reviews?produtor=${encodeURIComponent(id)}`)
        ]);

        if (ativo) {
          setDados(detalhes);
          setAvaliacoes(listaAvaliacoes);
        }
      } catch (err) {
        if (ativo) {
          setDados(null);
          setErro(err.message);
        }
      } finally {
        if (ativo) {
          setACarregar(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [id]);

  if (aCarregar) {
    return (
      <section className="produtor-publico">
        <p className="texto-secundario">
          A carregar produtor...
        </p>
      </section>
    );
  }

  if (erro || !dados) {
    return (
      <section className="produtor-publico">
        <h1>Não foi possível apresentar o produtor</h1>

        <p className="texto-secundario">
          {erro || 'Produtor não encontrado.'}
        </p>
      </section>
    );
  }

  const { produtor, produtos, avaliacaoMedia, totalAvaliacoes } = dados;

  const nome =
    produtor.produtor?.nomeExploracao ||
    produtor.nome;

  const localidade = produtor.produtor?.localidade || '';
  const descricao = produtor.produtor?.descricao || '';

  const avaliacoesProdutor = avaliacoes.filter(
    (avaliacao) => !avaliacao.produto
  );

  const avaliacoesProdutos = avaliacoes.filter(
    (avaliacao) => Boolean(avaliacao.produto)
  );

  return (
    <section className="produtor-publico">
      <div className="produtor-publico__cabecalho">
        <div>
          <p className="produtor-publico__etiqueta">
            PRODUTOR LOCAL
          </p>

          <h1>{nome}</h1>

          <p className="texto-secundario">
            {localidade || 'Localidade não indicada'}
          </p>
        </div>

        <div className="produtor-publico__avaliacao">
          {avaliacaoMedia !== null ? (
            <>
              <strong>
                <span className="text-warning">★ </span>
                {Number(avaliacaoMedia).toLocaleString('pt-PT', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })}
              </strong>

              <span>
                {totalAvaliacoes}{' '}
                {totalAvaliacoes === 1
                  ? 'avaliação do produtor'
                  : 'avaliações do produtor'}
              </span>
            </>
          ) : (
            <span>Ainda sem avaliações</span>
          )}
        </div>
      </div>

      <div className="produtor-publico__conteudo">
        <section className="produtor-publico__sobre">
          <h2>Sobre o produtor</h2>

          <p>
            {descricao || 'Este produtor ainda não adicionou uma descrição.'}
          </p>
        </section>

        <div className="produtor-publico__mapa">
          <span>
            Localização · {localidade || 'Não indicada'}
          </span>
        </div>
      </div>

      <section className="produtor-publico__produtos mb-5">
        <div className="produtor-publico__produtos-cabecalho">
          <div>
            <p className="produtor-publico__etiqueta">
              CATÁLOGO
            </p>

            <h2>Produtos disponíveis</h2>
          </div>
        </div>

        {produtos.length === 0 ? (
          <p className="texto-secundario">
            Este produtor ainda não tem produtos registados.
          </p>
        ) : (
          <div className="produtor-publico__grelha">
            {produtos.map((produto) => {
              const imagem = produto.imagemUrl
                ? new URL(produto.imagemUrl, API_URL).href
                : '';

              return (
                <article
                  key={produto._id}
                  className="produtor-produto"
                >
                  <div className="produtor-produto__imagem">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={produto.nome}
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        {produto.nome?.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="produtor-produto__conteudo">
                    <span className="texto-secundario small">
                      {produto.categoria}
                    </span>

                    <h3>{produto.nome}</h3>

                    <strong>
                      {euro(produto.preco)}
                      {produto.unidade
                        ? ` / ${produto.unidade}`
                        : ''}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="produtor-publico__avaliacoes">
        <p className="produtor-publico__etiqueta">
          OPINIÕES DOS CLIENTES
        </p>

        <h2 className="mb-4">
          Avaliações dos clientes
        </h2>

        <div className="mb-4">
          <h3 className="h5 mb-3">
            Avaliações do produtor
          </h3>

          {avaliacoesProdutor.length === 0 ? (
            <p className="texto-secundario">
              Este produtor ainda não recebeu avaliações.
            </p>
          ) : (
            <div className="d-grid gap-3">
              {avaliacoesProdutor.map((avaliacao) => (
                <CartaoAvaliacao
                  key={avaliacao._id}
                  avaliacao={avaliacao}
                  tipo="produtor"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="h5 mb-3">
            Avaliações dos produtos
          </h3>

          {avaliacoesProdutos.length === 0 ? (
            <p className="texto-secundario">
              Ainda não existem avaliações dos produtos.
            </p>
          ) : (
            <div className="d-grid gap-3">
              {avaliacoesProdutos.map((avaliacao) => (
                <CartaoAvaliacao
                  key={avaliacao._id}
                  avaliacao={avaliacao}
                  tipo="produto"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
