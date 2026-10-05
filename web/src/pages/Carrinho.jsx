import { useCarrinho } from '../context/CarrinhoContext.jsx';
import PorImplementar from '../components/PorImplementar.jsx';

const euro = (v) =>
  v.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function Carrinho() {
  const {
    linhas,
    alterarQuantidade,
    remover,
    esvaziar,
    total
  } = useCarrinho();

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Carrinho</h1>

        {linhas.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={esvaziar}
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {linhas.length === 0 ? (
        <p className="texto-secundario">
          O carrinho está vazio.
        </p>
      ) : (
        <div className="d-grid gap-3">
          {linhas.map(({ produto, quantidade }) => (
            <article
              key={produto._id}
              className="card"
            >
              <div className="card-body">
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <h2 className="h5 mb-1">
                      {produto.nome}
                    </h2>

                    <p className="texto-secundario mb-2">
                      {euro(produto.preco)} / {produto.unidade}
                    </p>

                    <p className="fw-bold mb-0">
                      Subtotal:{' '}
                      {euro(produto.preco * quantidade)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger align-self-start"
                    onClick={() => remover(produto._id)}
                  >
                    Remover
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    aria-label={`Diminuir quantidade de ${produto.nome}`}
                    onClick={() =>
                      alterarQuantidade(
                        produto._id,
                        quantidade - 1
                      )
                    }
                  >
                    −
                  </button>

                  <span
                    className="fw-bold text-center"
                    style={{ minWidth: '2rem' }}
                  >
                    {quantidade}
                  </span>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    aria-label={`Aumentar quantidade de ${produto.nome}`}
                    onClick={() =>
                      alterarQuantidade(
                        produto._id,
                        quantidade + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {linhas.length > 0 && (
        <div className="d-flex justify-content-end mt-4">
          <p className="fs-4 fw-bold mb-0">
            Total: {euro(total)}
          </p>
        </div>
      )}

      <div className="mt-4">
        <PorImplementar passo={3}>
          escolher levantamento ou entrega e submeter com{' '}
          <code>POST /api/orders</code> (uma encomenda por produtor).
        </PorImplementar>
      </div>
    </>
  );
}