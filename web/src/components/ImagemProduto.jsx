
import { useEffect, useRef, useState } from 'react';
import { API_URL, api } from '../api/client.js';

const LIMITE_IMAGEM = 5 * 1024 * 1024;
const TIPOS_ACEITES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImagemProduto({
  produto,
  token,
  onImagemAtualizada
}) {
  const [ficheiro, setFicheiro] = useState(null);
  const [previsualizacao, setPrevisualizacao] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (!ficheiro) {
      setPrevisualizacao('');
      return;
    }

    const url = URL.createObjectURL(ficheiro);
    setPrevisualizacao(url);

    return () => URL.revokeObjectURL(url);
  }, [ficheiro]);

  const imagemAtual = produto.imagemUrl
    ? new URL(produto.imagemUrl, API_URL).href
    : '';

  function selecionarImagem(evento) {
    const selecionado = evento.target.files?.[0];

    setErro('');
    setSucesso('');
    setFicheiro(null);

    if (!selecionado) return;

    if (!TIPOS_ACEITES.includes(selecionado.type)) {
      setErro('Utilize uma imagem JPEG, PNG ou WebP.');
      evento.target.value = '';
      return;
    }

    if (selecionado.size > LIMITE_IMAGEM) {
      setErro('A imagem não pode ultrapassar 5 MB.');
      evento.target.value = '';
      return;
    }

    setFicheiro(selecionado);
  }

  async function enviarImagem() {
    if (!ficheiro || aEnviar) return;

    try {
      setAEnviar(true);
      setErro('');
      setSucesso('');

      const formulario = new FormData();
      formulario.append('imagem', ficheiro);

      const resposta = await api(
        `/products/${produto._id}/imagem`,
        {
          metodo: 'POST',
          corpo: formulario,
          token
        }
      );

      onImagemAtualizada(resposta.imagemUrl);

      setFicheiro(null);
      setSucesso('Fotografia atualizada com sucesso!');

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  function cancelarSelecao() {
    setFicheiro(null);
    setErro('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="border rounded p-3 mt-3">
      <h3 className="h6 mb-3">Fotografia do produto</h3>

      <div className="d-flex flex-wrap align-items-start gap-3 mb-3">
        {previsualizacao || imagemAtual ? (
          <img
            src={previsualizacao || imagemAtual}
            alt={
              previsualizacao
                ? `Pré-visualização de ${produto.nome}`
                : `Fotografia de ${produto.nome}`
            }
            style={{
              width: 140,
              height: 110,
              objectFit: 'cover',
              borderRadius: 8
            }}
          />
        ) : (
          <div
            className="bg-light border rounded d-flex align-items-center justify-content-center text-secondary"
            style={{
              width: 140,
              height: 110
            }}
          >
            Sem fotografia
          </div>
        )}

        <div className="flex-grow-1">
          <label
            htmlFor={`imagem-${produto._id}`}
            className="form-label"
          >
            {produto.imagemUrl
              ? 'Substituir fotografia'
              : 'Adicionar fotografia'}
          </label>

          <input
            ref={inputRef}
            id={`imagem-${produto._id}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-control"
            onChange={selecionarImagem}
            disabled={aEnviar}
          />

          <small className="text-secondary">
            JPEG, PNG ou WebP. Máximo 5 MB.
          </small>
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="alert alert-success py-2" role="status">
          {sucesso}
        </div>
      )}

      {ficheiro && (
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={enviarImagem}
            disabled={aEnviar}
          >
            {aEnviar ? 'A enviar...' : 'Guardar fotografia'}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={cancelarSelecao}
            disabled={aEnviar}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
