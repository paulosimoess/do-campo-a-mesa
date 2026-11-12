// Painel do administrador
const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Review = require('../models/Review');
const a = require('../utils/async');

const erro = require('../utils/erro');

router.use(auth('admin'));

// GET /api/admin/estatisticas  -> 200 { utilizadores, produtores, encomendasHoje, leiloesAtivos }
router.get(
  '/estatisticas',
  a(async (req, res) => {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const [
      utilizadores,
      produtores,
      encomendasHoje,
      leiloesAtivos
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ papel: 'produtor' }),
      Order.countDocuments({
        createdAt: { $gte: inicioHoje }
      }),
      Auction.countDocuments({
        estado: 'ativo'
      })
    ]);

    res.json({
      utilizadores,
      produtores,
      encomendasHoje,
      leiloesAtivos
    });
  })
);

// GET /api/admin/produtores/pendentes  -> 200 [produtores por validar]
router.get(
  '/produtores/pendentes',
  a(async (req, res) => {
    const produtores = await User.find({
      papel: 'produtor',
      'produtor.validado': false,
      'produtor.rejeitado': { $ne: true }
    }).select('nome email produtor createdAt');

    res.json(produtores);
  })
);

// PATCH /api/admin/produtores/:id/validacao  { aprovado: true|false }  -> 200
router.patch(
  '/produtores/:id/validacao',
  a(async (req, res) => {
    const { aprovado } = req.body;

    if (typeof aprovado !== 'boolean') {
      throw erro(400, 'O campo aprovado deve ser true ou false');
    }

    const produtor = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        papel: 'produtor'
      },
      {
        'produtor.validado': aprovado,
        'produtor.rejeitado': !aprovado
      },
      {
        new: true,
        runValidators: true
      }
    ).select('nome email produtor');

    if (!produtor) {
      throw erro(404, 'Produtor não encontrado');
    }

    res.json(produtor);
  })
);

// GET /api/admin/reviews/denunciadas  -> 200
router.get(
  '/reviews/denunciadas',
  a(async (req, res) => {
    const avaliacoes = await Review.find({
      denuncias: { $gt: 0 }
    })
      .sort({ denuncias: -1, createdAt: -1 })
      .populate('autor', 'nome email')
      .populate('produtor', 'nome produtor.nomeExploracao')
      .populate('produto', 'nome categoria');

    res.json(avaliacoes);
  })
);

// PATCH /api/admin/reviews/:id  { visivel: false }  -> 200
router.patch(
  '/reviews/:id',
  a(async (req, res) => {
    const { visivel } = req.body;

    if (typeof visivel !== 'boolean') {
      throw erro(400, 'O campo visivel deve ser true ou false');
    }

    const avaliacao = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          visivel,
          denuncias: 0
        },
        $unset: {
          denunciantes: 1
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!avaliacao) {
      throw erro(404, 'Avaliação não encontrada');
    }

    res.json(avaliacao);
  })
);

module.exports = router;
