const LIMITE_STOCK_BAIXO = 15;

function emitirAlertaStockBaixo(io, {
  produto,
  stockAnterior,
  stockAtual
}) {
  if (!io || !produto) return false;

  const antes = Number(stockAnterior);
  const depois = Number(stockAtual);

  if (
    !Number.isFinite(antes) ||
    !Number.isFinite(depois) ||
    antes <= LIMITE_STOCK_BAIXO ||
    depois > LIMITE_STOCK_BAIXO
  ) {
    return false;
  }

  io.to(`user:${produto.produtor.toString()}`).emit(
    'stock-baixo',
    {
      produtoId: String(produto._id),
      nome: produto.nome,
      stock: depois,
      unidade: produto.unidade || 'unid.'
    }
  );

  return true;
}

module.exports = {
  LIMITE_STOCK_BAIXO,
  emitirAlertaStockBaixo
};