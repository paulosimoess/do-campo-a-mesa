import { useParams } from 'react-router-dom';
import produtosSimulados from '../data/produtos.json';

const produtoresSimulados = {
  '1': {
    nome: 'Horta da Ribeira',
    localidade: 'Ponte de Lima',
    descricao:
      'Produção local de frutas e hortícolas, com foco em produtos frescos e sazonais.',
    avaliacao: 4.8,
    totalAvaliacoes: 51
  },
  '2': {
    nome: 'Quinta da Lameira',
    localidade: 'Monção',
    descricao:
      'Produtor local dedicado à produção de vinho e produtos agrícolas da região.',
    avaliacao: 4.6,
    totalAvaliacoes: 34
  }
};

export default function Produtor() {
  const { id } = useParams();

  const produtor = produtoresSimulados[id] || produtoresSimulados['1'];

  const produtos = produtosSimulados.slice(0, 4);

  return (
    <section className="produtor-publico">
      <div className="produtor-publico__cabecalho">
        <div>
          <p className="produtor-publico__etiqueta">
            PRODUTOR LOCAL
          </p>

          <h1>{produtor.nome}</h1>

          <p className="texto-secundario">
            {produtor.localidade}
          </p>
        </div>

        <div className="produtor-publico__avaliacao">
          <strong>{produtor.avaliacao}</strong>

          <span>
            ★ · {produtor.totalAvaliacoes} avaliações
          </span>
        </div>
      </div>

      <div className="produtor-publico__conteudo">
        <section className="produtor-publico__sobre">
          <h2>Sobre o produtor</h2>

          <p>
            {produtor.descricao}
          </p>
        </section>

        <div className="produtor-publico__mapa">
          <span>
            Localização · {produtor.localidade}
          </span>
        </div>
      </div>

      <section className="produtor-publico__produtos">
        <div className="produtor-publico__produtos-cabecalho">
          <div>
            <p className="produtor-publico__etiqueta">
              CATÁLOGO
            </p>

            <h2>Produtos disponíveis</h2>
          </div>
        </div>

        <div className="produtor-publico__grelha">
          {produtos.map((produto) => (
            <article
              key={produto.id}
              className="produtor-produto"
            >
              <div className="produtor-produto__imagem">
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
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
                  {produto.preco} € / {produto.unidade}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}