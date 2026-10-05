// Componente reutilizável: cartão de produto do catálogo
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
          src={produto.imagemUrl}
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
          {produto.produtor?.nome}
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