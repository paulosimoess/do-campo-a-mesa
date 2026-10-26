import { useState } from 'react';
import { api } from '../api/client.js';

const ESTRELAS = [1, 2, 3, 4, 5];

export default function FormularioAvaliacao({
  encomenda,
  produtoId = null,
  nomeProduto = '',
  token,
  onAvaliada,
  onCancelar
}) {
  const [classificacao, setClassificacao] = useState(0);
  const [comentario, setComentario] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');

  const avaliarProduto = Boolean(produtoId);

  const idComentario = `comentario-${encomenda._id}-${
    produtoId || 'produtor'
  }`;

  async function submeter(evento) {
    evento.preventDefault();

    if (classificacao < 1 || aEnviar) {
      return;
    }

    try {
      setAEnviar(true);
      setErro('');

      const avaliacao = await api('/reviews', {
        metodo: 'POST',
        token,
        corpo: {
          encomenda: encomenda._id,
          ...(avaliarProduto ? { produto: produtoId } : {}),
          classificacao,
          comentario: comentario.trim()
        }
      });

      onAvaliada(avaliacao);
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form
      className="border rounded-3 p-3 mt-3"
      onSubmit={submeter}
    >
      <h3 className="h6 mb-3">
        {avaliarProduto
          ? `Avaliar produto${nomeProduto ? `: ${nomeProduto}` : ''}`
          : 'Avaliar produtor'}
      </h3>

      <fieldset disabled={aEnviar}>
        <legend className="fs-6 mb-2">
          {avaliarProduto
            ? 'Como avalia a qualidade deste produto?'
            : 'Como avalia a sua experiência com este produtor?'}
        </legend>

        <div
          className="d-flex align-items-center flex-wrap gap-2 mb-3"
          role="group"
          aria-label="Classificação de 1 a 5 estrelas"
        >
          {ESTRELAS.map((valor) => (
            <button
              key={valor}
              type="button"
              className="btn border-0 p-1"
              onClick={() => setClassificacao(valor)}
              aria-label={`${valor} de 5 estrelas`}
              aria-pressed={classificacao === valor}
              style={{
                fontSize: '2rem',
                lineHeight: 1,
                color:
                  valor <= classificacao
                    ? '#B56B12'
                    : '#777777'
              }}
            >
              {valor <= classificacao ? '★' : '☆'}
            </button>
          ))}

          <span className="texto-secundario ms-2">
            {classificacao === 0
              ? 'Selecione uma classificação'
              : `${classificacao}/5`}
          </span>
        </div>

        <div className="mb-3">
          <label
            htmlFor={idComentario}
            className="form-label"
          >
            Comentário (opcional)
          </label>

          <textarea
            id={idComentario}
            className="form-control"
            rows={3}
            placeholder={
              avaliarProduto
                ? 'O que achou deste produto?'
                : 'Como correu a sua experiência com o produtor?'
            }
            value={comentario}
            onChange={(evento) =>
              setComentario(evento.target.value)
            }
          />
        </div>
      </fieldset>

      {erro && (
        <div
          className="alert alert-danger py-2"
          role="alert"
        >
          {erro}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn btn-success btn-sm"
          disabled={aEnviar || classificacao === 0}
        >
          {aEnviar
            ? 'A enviar...'
            : 'Enviar avaliação'}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onCancelar}
          disabled={aEnviar}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
