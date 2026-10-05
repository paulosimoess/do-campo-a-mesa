import { Link } from 'react-router-dom';

export default function CartaoLeilaoDestaque() {
  return (
    <article className="leilao-destaque">
      <div className="leilao-destaque__topo">
        <span className="leilao-destaque__estado">
          EM DIRETO
        </span>

        <span className="leilao-destaque__participantes">
          8 participantes
        </span>
      </div>

      <h2>200 kg de kiwi Hayward, calibre A</h2>

      <p className="leilao-destaque__produtor">
        Horta da Ribeira · Ponte de Lima
      </p>

      <div className="leilao-destaque__dados">
        <div>
          <span>Licitação atual</span>
          <strong>312,00 €</strong>
        </div>

        <div>
          <span>Termina em</span>
          <strong>02:47</strong>
        </div>
      </div>

      <Link to="/leiloes" className="btn btn-light w-100">
        Entrar no leilão
      </Link>
    </article>
  );
}