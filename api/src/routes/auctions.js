// Leilões (a parte REST; as licitações em direto são feitas por Socket.io)
const router = require('express').Router();
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');
const produtorValidado = require('../middleware/produtorValidado');

// GET /api/auctions?estado=ativo  -> 200 [leilões]
router.get('/', a(async (req, res) => {
  const { estado } = req.query;
  const filtro = {};

  if (estado) {
    filtro.estado = estado;
  }

  const leiloes = await Auction.find(filtro)
    .sort({ iniciaEm: 1 })
    .populate(
      'produtor',
      'nome produtor.nomeExploracao produtor.localidade'
    )
    .populate('produto', 'nome categoria unidade');

  res.json(leiloes);
}));

// GET /api/auctions/:id/bids  -> 200 [licitações]
router.get('/:id/bids', a(async (req, res) => {
  const existe = await Auction.exists({
    _id: req.params.id
  });

  if (!existe) {
    throw erro(404, 'Leilão não encontrado');
  }

  const licitacoes = await Bid.find({
    leilao: req.params.id
  })
    .sort({ createdAt: -1 })
    .populate('comprador', 'nome');

  res.json(licitacoes);
}));

// GET /api/auctions/:id  -> 200 leilão + últimas licitações
router.get('/:id', a(async (req, res) => {
  const leilao = await Auction.findById(req.params.id)
    .populate(
      'produtor',
      'nome produtor.nomeExploracao produtor.localidade'
    )
    .populate('produto', 'nome categoria unidade');

  if (!leilao) {
    throw erro(404, 'Leilão não encontrado');
  }

  const licitacoes = await Bid.find({
    leilao: leilao._id
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('comprador', 'nome');

  res.json({
    leilao,
    licitacoes
  });
}));

// POST /api/auctions  (produtor)  -> 201
router.post(
  '/',
  auth('produtor'),
  produtorValidado,
  a(async (req, res) => {
    const {
      produto,
      lote,
      quantidade,
      precoBase,
      incremento,
      iniciaEm,
      duracaoMin
    } = req.body;

    if (
      !lote ||
      precoBase == null ||
      incremento == null ||
      !iniciaEm ||
      duracaoMin == null
    ) {
      throw erro(400, 'Dados do leilão incompletos');
    }

    const inicio = new Date(iniciaEm);

    if (Number.isNaN(inicio.getTime())) {
      throw erro(400, 'Data de início inválida');
    }

    const duracao = Number(duracaoMin);

    if (!Number.isFinite(duracao) || duracao <= 0) {
      throw erro(400, 'Duração inválida');
    }

    const fim = new Date(
      inicio.getTime() + duracao * 60 * 1000
    );

    const agora = new Date();

    const leilao = await Auction.create({
      produtor: req.user.id,
      produto,
      lote,
      quantidade,
      precoBase,
      incremento,
      licitacaoAtual: {
        valor: precoBase
      },
      iniciaEm: inicio,
      terminaEm: fim,
      estado: inicio <= agora ? 'ativo' : 'agendado'
    });

    res
      .status(201)
      .location(`/api/auctions/${leilao._id}`)
      .json(leilao);
  })
);

module.exports = router;
