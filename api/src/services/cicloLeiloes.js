
const Auction = require('../models/Auction');
const Order = require('../models/Order');

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

async function fecharExpiradosComVencedor(io) {
  const agora = new Date();

  // Inclui também leilões terminados cuja encomenda
  // ficou por criar devido a uma falha ou reinício.
  const pendentes = await Auction.find({
    'licitacaoAtual.comprador': { $ne: null },
    $or: [
      {
        estado: 'ativo',
        terminaEm: { $lte: agora }
      },
      {
        estado: 'terminado',
        encomenda: null
      }
    ]
  });

  for (const candidato of pendentes) {
    try {
      let leilao = candidato;

      if (leilao.estado === 'ativo') {
        leilao = await Auction.findOneAndUpdate(
          {
            _id: candidato._id,
            estado: 'ativo',
            terminaEm: { $lte: new Date() }
          },
          { $set: { estado: 'terminado' } },
          { new: true }
        );

        if (!leilao) continue;
      }

      const filtro = {
        origem: 'leilao',
        leilao: leilao._id
      };

      let encomenda;

      try {
        encomenda = await Order.findOneAndUpdate(
          filtro,
          {
            $setOnInsert: {
              comprador: leilao.licitacaoAtual.comprador,
              produtor: leilao.produtor,
              linhas: [{
                produto: leilao.produto,
                nome: `Lote: ${leilao.lote}`,
                precoUnit: leilao.licitacaoAtual.valor,
                unidade: 'lote',
                quantidade: 1
              }],
              estado: 'confirmada'
            }
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true
          }
        );
      } catch (erro) {
        if (erro.code !== 11000) throw erro;

        encomenda = await Order.findOne(filtro);

        if (!encomenda) throw erro;
      }

      await Auction.updateOne(
        {
          _id: leilao._id,
          encomenda: null
        },
        {
          $set: { encomenda: encomenda._id }
        }
      );

      io.to(`leilao:${leilao._id}`).emit('terminado', {
        vencedor: {
          id: String(leilao.licitacaoAtual.comprador),
          nome: leilao.licitacaoAtual.nome
        },
        valor: leilao.licitacaoAtual.valor,
        encomendaId: String(encomenda._id)
      });

      io.to(`user:${leilao.licitacaoAtual.comprador}`).emit(
        'leilao-ganho',
        {
          leilaoId: String(leilao._id),
          encomendaId: String(encomenda._id),
          valor: leilao.licitacaoAtual.valor
        }
      );

      console.log(
        `Leilão terminado com vencedor: ${leilao._id}`
      );

    } catch (erro) {
      console.error(
        `Erro ao finalizar leilão ${candidato._id}:`,
        erro
      );
    }
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
      await fecharExpiradosComVencedor(io);
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
