
const Auction = require('../models/Auction');

async function abrirAgendados(io) {
  const agora = new Date();

  const agendados = await Auction.find({
    estado: 'agendado',
    iniciaEm: { $lte: agora },
    terminaEm: { $gt: agora }
  }).select('_id');

  for (const { _id } of agendados) {
    const leilao = await Auction.findOneAndUpdate(
      {
        _id,
        estado: 'agendado',
        iniciaEm: { $lte: agora },
        terminaEm: { $gt: agora }
      },
      { $set: { estado: 'ativo' } },
      { new: true }
    );

    if (!leilao) continue;

    io.to(`leilao:${_id}`).emit('aberto', {
      leilaoId: String(_id)
    });

    console.log(`Leilão iniciado: ${_id}`);
  }
}

async function fecharExpiradosSemVencedor(io) {
  const agora = new Date();

  const expirados = await Auction.find({
    estado: { $in: ['agendado', 'ativo'] },
    terminaEm: { $lte: agora },
    'licitacaoAtual.comprador': { $exists: false }
  }).select('_id');

  for (const { _id } of expirados) {
    const leilao = await Auction.findOneAndUpdate(
      {
        _id,
        estado: { $in: ['agendado', 'ativo'] },
        terminaEm: { $lte: new Date() },
        'licitacaoAtual.comprador': { $exists: false }
      },
      { $set: { estado: 'terminado' } },
      { new: true }
    );

    if (!leilao) continue;

    io.to(`leilao:${_id}`).emit('terminado', {
      vencedor: null,
      valor: null
    });

    console.log(`Leilão terminado sem vencedor: ${_id}`);
  }
}

function iniciarCicloLeiloes(io) {
  let emExecucao = false;

  const executar = async () => {
    if (emExecucao) return;

    emExecucao = true;

    try {
      await abrirAgendados(io);
      await fecharExpiradosSemVencedor(io);
    } catch (erro) {
      console.error('Erro no ciclo dos leilões:', erro);
    } finally {
      emExecucao = false;
    }
  };

  executar();

  const intervalo = setInterval(executar, 2000);

  return () => clearInterval(intervalo);
}

module.exports = { iniciarCicloLeiloes };
