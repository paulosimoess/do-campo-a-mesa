require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const {
  obterLocalizacaoAproximada
} = require('../services/geocodificacao');

async function preencherLocalizacoes() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI não configurada');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const produtores = await User.find({
      papel: 'produtor'
    });

    console.log(`Produtores encontrados: ${produtores.length}`);

    for (const utilizador of produtores) {
      const localidade = String(
        utilizador.produtor?.localidade || ''
      ).trim();

      const localizacao = utilizador.produtor?.localizacao;

      if (!localidade) {
        console.log(`${utilizador.nome}: sem localidade`);
        continue;
      }

      if (
        Number.isFinite(localizacao?.lat) &&
        Number.isFinite(localizacao?.lng)
      ) {
        console.log(`${utilizador.nome}: já tem coordenadas`);
        continue;
      }

      if (
        localizacao?.lat != null ||
        localizacao?.lng != null
      ) {
        console.log(`${utilizador.nome}: rever coordenadas existentes`);
        continue;
      }

      try {
        const coordenadas =
          await obterLocalizacaoAproximada(localidade);

        if (!coordenadas) {
          console.log(
            `${utilizador.nome}: localidade não encontrada (${localidade})`
          );
          continue;
        }

        const resultado = await User.updateOne(
          {
            _id: utilizador._id,
            'produtor.localizacao.lat': { $exists: false },
            'produtor.localizacao.lng': { $exists: false }
          },
          {
            $set: {
              'produtor.localizacao.lat': coordenadas.lat,
              'produtor.localizacao.lng': coordenadas.lng,
              'produtor.localizacao.origem': 'localidade'
            }
          }
        );

        if (resultado.modifiedCount === 1) {
          console.log(
            `${utilizador.nome} (${localidade}):`,
            coordenadas
          );
        } else {
          console.log(
            `${utilizador.nome}: localização não alterada`
          );
        }
      } catch (err) {
        console.error(
          `Erro ao localizar ${utilizador.nome}:`,
          err.message
        );
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

preencherLocalizacoes().catch((err) => {
  console.error('Erro:', err.message);
  process.exitCode = 1;
});