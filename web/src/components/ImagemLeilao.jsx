import { useState } from 'react';

function obterUrlImagem(imagemUrl) {
  if (!imagemUrl) return '';

  if (/^https?:\/\//i.test(imagemUrl)) {
    return imagemUrl;
  }

  if (!imagemUrl.startsWith('/uploads/')) {
    return '';
  }

  const apiUrl = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
  ).replace(/\/+$/, '');

  return `${apiUrl}${imagemUrl}`;
}

export default function ImagemLeilao({
  leilao,
  className = ''
}) {
  const [imagemComErro, setImagemComErro] = useState('');

  const imagemUrl =
    leilao?.imagemUrl ||
    leilao?.produto?.imagemUrl ||
    '';

  const url = obterUrlImagem(imagemUrl);
  const mostrarImagem = url && imagemComErro !== url;

  return (
    <div className={className}>
      {mostrarImagem ? (
        <img
          src={url}
          alt={`Fotografia do lote ${leilao.lote}`}
          loading="lazy"
          onError={() => setImagemComErro(url)}
        />
      ) : (
        <span>Sem fotografia disponível</span>
      )}
    </div>
  );
}