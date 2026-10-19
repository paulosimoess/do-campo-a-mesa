import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { useAuth } from './AuthContext.jsx';

const CarrinhoContext = createContext(null);

function lerCarrinho(chave) {
  if (!chave) {
    return [];
  }

  try {
    const guardado = localStorage.getItem(chave);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

function guardarCarrinho(chave, linhas) {
  if (!chave) {
    return;
  }

  try {
    localStorage.setItem(
      chave,
      JSON.stringify(linhas)
    );
  } catch {
    // Se o armazenamento não estiver disponível,
    // o carrinho continua a funcionar apenas em memória.
  }
}

export function CarrinhoProvider({ children }) {
  const { utilizador } = useAuth();

  const chaveCarrinho = utilizador?.id
    ? `carrinho:${utilizador.id}`
    : null;

  const [linhas, setLinhas] = useState([]);

  useEffect(() => {
    setLinhas(
      lerCarrinho(chaveCarrinho)
    );
  }, [chaveCarrinho]);

  function atualizarLinhas(atualizacao) {
    setLinhas((atual) => {
      const novasLinhas =
        typeof atualizacao === 'function'
          ? atualizacao(atual)
          : atualizacao;

      guardarCarrinho(
        chaveCarrinho,
        novasLinhas
      );

      return novasLinhas;
    });
  }

  function adicionar(produto, quantidade = 1) {
    atualizarLinhas((atual) => {
      const existe = atual.find(
        (l) => l.produto._id === produto._id
      );

      if (existe) {
        return atual.map((l) =>
          l.produto._id === produto._id
            ? {
                ...l,
                quantidade:
                  l.quantidade + quantidade
              }
            : l
        );
      }

      return [
        ...atual,
        {
          produto,
          quantidade
        }
      ];
    });
  }

  function alterarQuantidade(produtoId, quantidade) {
    atualizarLinhas((atual) =>
      quantidade < 1
        ? atual.filter(
            (l) =>
              l.produto._id !== produtoId
          )
        : atual.map((l) =>
            l.produto._id === produtoId
              ? {
                  ...l,
                  quantidade
                }
              : l
          )
    );
  }

  function remover(produtoId) {
    alterarQuantidade(produtoId, 0);
  }

  function esvaziar() {
    atualizarLinhas([]);
  }

  const total = useMemo(
    () =>
      linhas.reduce(
        (soma, linha) =>
          soma +
          linha.produto.preco *
            linha.quantidade,
        0
      ),
    [linhas]
  );

  return (
    <CarrinhoContext.Provider
      value={{
        linhas,
        adicionar,
        alterarQuantidade,
        remover,
        esvaziar,
        total
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export const useCarrinho = () =>
  useContext(CarrinhoContext);