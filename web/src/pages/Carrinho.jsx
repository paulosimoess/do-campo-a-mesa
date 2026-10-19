import { useState } from 'react';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

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

  const { token } = useAuth();

  const [entrega, setEntrega] = useState({
    tipo: 'levantamento',
    morada: ''
  });

  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [aSubmeter, setASubmeter] = useState(false);

  async function finalizarEncomenda() {
    try {
      setErro('');
      setMensagem('');
      setASubmeter(true);

      const corpo = {
        linhas: linhas.map(({ produto, quantidade }) => ({
          produto: produto._id,
          quantidade
        })),
        entrega: {
          tipo: entrega.tipo,
          ...(entrega.tipo === 'entrega'
            ? { morada: entrega.morada }
            : {})
        }
      };

      await api('/orders', {
        metodo: 'POST',
        corpo,
        token
      });

      esvaziar();

      setMensagem('Encomenda criada com sucesso.');
    } catch (err) {
      setErro(err.message);
    } finally {
      setASubmeter(false);
    }
  }

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
        <section className="mt-4">
          <h2 className="h5 mb-3">
            Entrega
          </h2>

          <div className="mb-3">
            <label
              htmlFor="tipo-entrega"
              className="form-label"
            >
              Método de entrega
            </label>

            <select
              id="tipo-entrega"
              className="form-select"
              value={entrega.tipo}
              onChange={(e) =>
                setEntrega({
                  ...entrega,
                  tipo: e.target.value
                })
              }
            >
              <option value="levantamento">
                Levantamento
              </option>

              <option value="entrega">
                Entrega
              </option>
            </select>
          </div>

          {entrega.tipo === 'entrega' && (
            <div className="mb-3">
              <label
                htmlFor="morada"
                className="form-label"
              >
                Morada
              </label>

              <input
                id="morada"
                type="text"
                className="form-control"
                value={entrega.morada}
                onChange={(e) =>
                  setEntrega({
                    ...entrega,
                    morada: e.target.value
                  })
                }
                required
              />
            </div>
          )}

          <button
            type="button"
            className="btn btn-success"
            onClick={finalizarEncomenda}
            disabled={
              aSubmeter ||
              (entrega.tipo === 'entrega' &&
                !entrega.morada.trim())
            }
          >
            {aSubmeter
              ? 'A criar encomenda...'
              : 'Finalizar encomenda'}
          </button>
        </section>
      )}

      {mensagem && (
            <div className="alert alert-success mt-3 mb-0">
              {mensagem}
            </div>
          )}

      {erro && (
        <div className="alert alert-danger mt-3 mb-0">
          {erro}
        </div>
      )}
    </>
  );
}