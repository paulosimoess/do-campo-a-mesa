// Estado global do carrinho
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const CarrinhoContext = createContext(null);

function lerCarrinho() {
  try {
    const guardado = localStorage.getItem('carrinho');
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }) {
  const [linhas, setLinhas] = useState(lerCarrinho);

  useEffect(() => {
    try {
      localStorage.setItem('carrinho', JSON.stringify(linhas));
    } catch {
      // Se o armazenamento não estiver disponível,
      // o carrinho continua a funcionar apenas em memória.
    }
  }, [linhas]);

  function adicionar(produto, quantidade = 1) {
    setLinhas((atual) => {
      const existe = atual.find(
        (l) => l.produto._id === produto._id
      );

      if (existe) {
        return atual.map((l) =>
          l.produto._id === produto._id
            ? {
                ...l,
                quantidade: l.quantidade + quantidade
              }
            : l
        );
      }

      return [...atual, { produto, quantidade }];
    });
  }

  function alterarQuantidade(produtoId, quantidade) {
    setLinhas((atual) =>
      quantidade < 1
        ? atual.filter(
            (l) => l.produto._id !== produtoId
          )
        : atual.map((l) =>
            l.produto._id === produtoId
              ? { ...l, quantidade }
              : l
          )
    );
  }

  function remover(produtoId) {
    alterarQuantidade(produtoId, 0);
  }

  function esvaziar() {
    setLinhas([]);
  }

  const total = useMemo(
    () =>
      linhas.reduce(
        (soma, linha) =>
          soma +
          linha.produto.preco * linha.quantidade,
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