import { API_URL } from '../api/client';
import { Link } from 'react-router-dom';

const euro = (v) =>
  v.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function CartaoProduto({ produto, onAdicionar }) {
  return (
    <article className="card cartao-produto h-100">
      {produto.imagemUrl ? (
        <img
          src={new URL(produto.imagemUrl, API_URL).href}
          className="cartao-produto__foto"
          alt={produto.nome}
          loading="lazy"
        />
      ) : (
        <div className="cartao-produto__imagem" aria-hidden="true">
          <span>{produto.nome.charAt(0)}</span>
        </div>
      )}

      <div className="card-body d-flex flex-column">
        <div className="cartao-produto__etiquetas">
          {produto.biologico && (
            <span className="etiqueta-bio">
              BIO
            </span>
          )}
        </div>

        <h3 className="cartao-produto__nome">
          {produto.nome}
        </h3>

        <p className="cartao-produto__produtor">
          {produto.produtor?._id ? (
            <Link
              to={`/produtores/${produto.produtor._id}`}
              className="text-reset text-decoration-underline"
            >
              {produto.produtor.produtor?.nomeExploracao ||
                produto.produtor.nome ||
                'Produtor'}
            </Link>
          ) : (
            produto.produtor?.produtor?.nomeExploracao ||
            produto.produtor?.nome ||
            'Produtor'
          )}

          {produto.produtor?.produtor?.localidade &&
            ` · ${produto.produtor.produtor.localidade}`}
        </p>

        <p className="preco mt-auto">
          {euro(produto.preco)}
          <span className="texto-secundario small">
            {' '} / {produto.unidade}
          </span>
        </p>

        {onAdicionar && (
          <button
            type="button"
            className="btn btn-success w-100"
            onClick={onAdicionar}
          >
            Adicionar ao carrinho
          </button>
        )}
      </div>
    </article>
  );
}