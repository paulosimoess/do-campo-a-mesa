// Páginas públicas dos produtores
const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const a = require('../utils/async');
const erro = require('../utils/erro');
const auth = require('../middleware/auth');

// GET /api/producers?localidade=  -> 200 [produtores validados]
router.get(
  '/',
  a(async (req, res) => {
    const { localidade } = req.query;

    const filtro = {
      papel: 'produtor',
      'produtor.validado': true
    };

    if (localidade) {
      filtro['produtor.localidade'] = {
        $regex: localidade,
        $options: 'i'
      };
    }

    const produtores = await User.find(filtro)
      .select('nome produtor createdAt')
      .sort({ nome: 1 });

    res.json(produtores);
  })
);

// PATCH /api/producers/me — editar a própria exploração
router.patch(
  '/me',
  auth('produtor'),
  a(async (req, res) => {
    const { nomeExploracao, descricao } = req.body || {};

    if (
      typeof nomeExploracao !== 'string' ||
      typeof descricao !== 'string'
    ) {
      throw erro(400, 'Dados do perfil inválidos');
    }

    const nome = nomeExploracao.trim();
    const texto = descricao.trim();

    if (!nome || nome.length > 100 || texto.length > 1000) {
      throw erro(400, 'Nome ou descrição inválidos');
    }

    const atualizado = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        papel: 'produtor'
      },
      {
        $set: {
          'produtor.nomeExploracao': nome,
          'produtor.descricao': texto
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!atualizado) {
      throw erro(404, 'Produtor não encontrado');
    }

    res.json({
      nomeExploracao: atualizado.produtor.nomeExploracao,
      descricao: atualizado.produtor.descricao || ''
    });
  })
);

// GET /api/producers/:id  -> 200 { produtor, produtos, avaliacaoMedia }
router.get(
  '/:id',
  a(async (req, res) => {
    const produtor = await User.findOne({
      _id: req.params.id,
      papel: 'produtor',
      'produtor.validado': true
    }).select('nome produtor createdAt');

    if (!produtor) {
      throw erro(404, 'Produtor não encontrado');
    }

    const produtos = await Product.find({
      produtor: produtor._id
    }).sort({ createdAt: -1 });

    const avaliacoes = await Review.find({
      produtor: produtor._id,
      visivel: true,
      produto: null
    }).select('classificacao');

    const totalAvaliacoes = avaliacoes.length;

    const avaliacaoMedia =
      totalAvaliacoes > 0
        ? avaliacoes.reduce(
            (soma, avaliacao) => soma + avaliacao.classificacao,
            0
          ) / totalAvaliacoes
        : null;

    res.json({
      produtor,
      produtos,
      avaliacaoMedia,
      totalAvaliacoes
    });
  })
);

module.exports = router;
