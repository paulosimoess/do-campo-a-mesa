
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartaoProduto from '../components/CartaoProduto.jsx';
import CartaoLeilaoDestaque from '../components/CartaoLeilaoDestaque.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import produtosSimulados from '../data/produtos.json';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Inicio() {
  const [produtos, setProdutos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');

  const carrinho = useCarrinho();
  const { utilizador } = useAuth();

  useEffect(() => {
    let montado = true;

    async function carregarProdutos() {
      try {
        if (USAR_DADOS_SIMULADOS) {
          setProdutos(produtosSimulados.slice(0, 4));
          return;
        }

        const dados = await api('/products');

        if (montado) {
          // A API já devolve os produtos mais recentes primeiro.
          setProdutos(dados.slice(0, 4));
        }
      } catch (err) {
        if (montado) {
          setErro(err.message);
        }
      } finally {
        if (montado) {
          setACarregar(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      montado = false;
    };
  }, []);

  return (
    <>
      <section className="destaque">
        <div className="destaque__conteudo">
          <p className="destaque__etiqueta">
            PRODUTORES LOCAIS · ALTO MINHO
          </p>

          <h1>
            Direto de quem produz, para a sua mesa.
          </h1>

          <p className="destaque__descricao">
            Descubra produtos locais, conheça quem os produz
            e acompanhe lotes sazonais em leilão,
            tudo num só lugar.
          </p>
        </div>

        <CartaoLeilaoDestaque />
      </section>

      <section
        className="seccao-produtos"
        aria-labelledby="titulo-produtos-destaque"
      >
        <div className="seccao-produtos__cabecalho">
          <p className="seccao-produtos__etiqueta">
            CATÁLOGO
          </p>

          <h2 id="titulo-produtos-destaque">
            Descubra os nossos produtos
          </h2>

          <p className="seccao-produtos__descricao">
            Conheça alguns dos produtos mais recentes
            dos nossos produtores locais.
          </p>
        </div>

        {aCarregar && (
          <p className="texto-secundario">
            A carregar produtos...
          </p>
        )}

        {erro && (
          <div className="alert alert-danger" role="alert">
            Não foi possível carregar os produtos: {erro}
          </div>
        )}

        {!aCarregar && !erro && produtos.length === 0 && (
          <p className="texto-secundario">
            Ainda não existem produtos disponíveis.
          </p>
        )}

        {!erro && (
          <div
            className="grelha-produtos"
            aria-label="Produtos em destaque"
          >
            {produtos.map((produto) => (
              <CartaoProduto
                key={produto._id}
                produto={produto}
                onAdicionar={
                  utilizador?.papel === 'comprador'
                    ? () => carrinho.adicionar(produto)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link
            to="/produtos"
            className="btn btn-outline-success"
          >
            Ver todos os produtos
          </Link>
        </div>
      </section>
    </>
  );
}
