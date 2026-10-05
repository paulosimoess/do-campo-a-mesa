import produtosSimulados from '../../data/produtos.json';

export default function ProdutosProdutor() {
  return (
    <section className="produtos-produtor">
      <div className="produtos-produtor__cabecalho">
        <div>
          <p className="produtos-produtor__etiqueta">
            CATÁLOGO DO PRODUTOR
          </p>

          <h1>Gerir produtos</h1>

          <p className="texto-secundario">
            Consulte os seus produtos, preços e stock.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
        >
          Novo produto
        </button>
      </div>

      <div className="produtos-produtor__lista">
        {produtosSimulados.slice(0, 5).map((produto) => (
          <article
            key={produto._id}
            className="produto-gestao"
          >
            <div>
              <h2>{produto.nome}</h2>

              <p className="texto-secundario">
                {produto.categoria} · {produto.preco.toFixed(2)} € / {produto.unidade}
              </p>
            </div>

            <div className="produto-gestao__stock">
              <span>Stock</span>
              <strong>{produto.stock}</strong>
            </div>

            <div className="produto-gestao__acoes">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
              >
                Editar
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}