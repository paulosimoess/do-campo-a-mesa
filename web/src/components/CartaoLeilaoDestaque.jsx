import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ImagemLeilao from './ImagemLeilao.jsx';

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });
}

function formatarTempo(milissegundos) {
  const segundos = Math.max(
    0,
    Math.ceil(milissegundos / 1000)
  );

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restoSegundos = segundos % 60;

  const relogio = [horas, minutos, restoSegundos]
    .map((valor) => String(valor).padStart(2, '0'))
    .join(':');

  return dias > 0 ? `${dias}d ${relogio}` : relogio;
}

export default function CartaoLeilaoDestaque() {
  const [leiloes, setLeiloes] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    let montado = true;

    async function carregarLeiloes() {
      try {
        const dados = await api('/auctions');

        if (montado) {
          setLeiloes(dados);
          setErro('');
        }
      } catch (err) {
        if (montado) {
          setErro(err.message || 'Erro ao carregar leilões.');
        }
      } finally {
        if (montado) {
          setACarregar(false);
        }
      }
    }

    carregarLeiloes();

    const atualizacao = setInterval(carregarLeiloes, 30000);

    const relogio = setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => {
      montado = false;
      clearInterval(atualizacao);
      clearInterval(relogio);
    };
  }, []);

  const ativos = leiloes
    .filter(
      (leilao) =>
        leilao.estado === 'ativo' &&
        new Date(leilao.iniciaEm).getTime() <= agora &&
        new Date(leilao.terminaEm).getTime() > agora
    )
    .sort(
      (a, b) =>
        new Date(a.terminaEm) - new Date(b.terminaEm)
    );

  const agendados = leiloes
    .filter(
      (leilao) =>
        leilao.estado === 'agendado' &&
        new Date(leilao.iniciaEm).getTime() > agora
    )
    .sort(
      (a, b) =>
        new Date(a.iniciaEm) - new Date(b.iniciaEm)
    );

  const leilao = ativos[0] || agendados[0];
  const emDireto = leilao?.estado === 'ativo';

  if (aCarregar || erro || !leilao) {
    return (
      <article className="leilao-destaque">
        <div className="leilao-destaque__topo">
          <span className="leilao-destaque__estado">
            LEILÕES LOCAIS
          </span>
        </div>

        <h2>
          {aCarregar
            ? 'A carregar leilões...'
            : erro
              ? 'Não foi possível carregar os leilões'
              : 'De momento não há leilões disponíveis'}
        </h2>

        <p className="leilao-destaque__produtor">
          {erro
            ? 'Pode consultar a página de leilões e tentar novamente.'
            : 'Explore os leilões dos nossos produtores locais.'}
        </p>

        <Link to="/leiloes" className="btn btn-light w-100">
          Ver leilões
        </Link>
      </article>
    );
  }

  const produtor = leilao.produtor;

  const nomeProdutor =
    produtor?.produtor?.nomeExploracao ||
    produtor?.nome ||
    'Produtor local';

  const localidade = produtor?.produtor?.localidade;

  const preco =
    emDireto
      ? leilao.licitacaoAtual?.valor ?? leilao.precoBase
      : leilao.precoBase;

  const dataReferencia = emDireto
    ? leilao.terminaEm
    : leilao.iniciaEm;

  const tempoRestante = formatarTempo(
    new Date(dataReferencia).getTime() - agora
  );

  return (
    <article className="leilao-destaque">
      <div className="leilao-destaque__topo">
        <span className="leilao-destaque__estado">
          {emDireto ? 'EM DIRETO' : 'PRÓXIMO LEILÃO'}
        </span>
      </div>

      <ImagemLeilao
        leilao={leilao}
        className="leilao-destaque__imagem"
      />
      <h2>{leilao.lote}</h2>

      <p className="leilao-destaque__produtor">
        {nomeProdutor}
        {localidade && ` · ${localidade}`}
      </p>

      <div className="leilao-destaque__dados">
        <div>
          <span>
            {emDireto ? 'Licitação atual' : 'Preço base'}
          </span>

          <strong>{formatarPreco(preco)}</strong>
        </div>

        <div>
          <span>
            {emDireto ? 'Termina em' : 'Começa em'}
          </span>

          <strong>{tempoRestante}</strong>
        </div>
      </div>

      <Link
        to={`/leiloes/${leilao._id}`}
        className="btn btn-light w-100"
      >
        {emDireto ? 'Entrar no leilão' : 'Ver leilão'}
      </Link>
    </article>
  );
}
