const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

function emitirToken(utilizador) {
  return jwt.sign(
    {
      id: utilizador._id.toString(),
      papel: utilizador.papel,
      nome: utilizador.nome
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    }
  );
}

// POST /api/auth/registo
router.post(
  '/registo',
  a(async (req, res) => {
    const {
      nome,
      email,
      password,
      papel,
      produtor
    } = req.body;

    if (!nome || !email || !password) {
      throw erro(400, 'Nome, email e password são obrigatórios');
    }

    if (password.length < 8) {
      throw erro(400, 'A password deve ter pelo menos 8 caracteres');
    }

    if (papel && !['comprador', 'produtor'].includes(papel)) {
      throw erro(400, 'Papel inválido');
    }

    const papelFinal = papel || 'comprador';

    const passwordHash = await bcrypt.hash(password, 12);

    const dados = {
      nome,
      email: String(email).toLowerCase(),
      passwordHash,
      papel: papelFinal
    };

    if (papelFinal === 'produtor') {
      dados.produtor = {
        ...produtor,
        validado: false
      };
    }

    const utilizador = await User.create(dados);

    res.status(201).json({
      id: utilizador._id
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  a(async (req, res) => {
    const { email, password } = req.body;

    const utilizador = await User.findOne({
      email: String(email || '').toLowerCase()
    }).select('+passwordHash');

    const passwordCorreta =
      utilizador &&
      await bcrypt.compare(
        String(password || ''),
        utilizador.passwordHash
      );

    if (!utilizador || !passwordCorreta) {
      throw erro(401, 'Credenciais inválidas');
    }

    res.json({
      token: emitirToken(utilizador),
      utilizador: utilizador.publico()
    });
  })
);

// GET /api/auth/eu
router.get(
  '/eu',
  auth(),
  a(async (req, res) => {
    const utilizador = await User.findById(req.user.id);

    if (!utilizador) {
      throw erro(404, 'Utilizador não encontrado');
    }

    res.json(utilizador.publico());
  })
);

module.exports = router;