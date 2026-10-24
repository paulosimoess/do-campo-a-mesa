
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');
const erro = require('../utils/erro');

const TIPOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const PASTA_UPLOADS = path.join(
  __dirname,
  '..',
  '..',
  'uploads'
);

let container;

function obterContainer() {
  if (!container) {
    if (!process.env.STORAGE_CONN) {
      throw new Error('STORAGE_CONN não está definida');
    }

    container = BlobServiceClient
      .fromConnectionString(process.env.STORAGE_CONN)
      .getContainerClient(
        process.env.STORAGE_CONTAINER || 'produtos'
      );
  }

  return container;
}

function assinaturaValida(ficheiro) {
  const buffer = ficheiro.buffer;
  const tipo = ficheiro.mimetype;

  if (tipo === 'image/jpeg') {
    return buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;
  }

  if (tipo === 'image/png') {
    const assinatura = Buffer.from(
      '89504e470d0a1a0a', 'hex'
    );

    return buffer.subarray(0, 8).equals(assinatura);
  }

  if (tipo === 'image/webp') {
    return buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }

  return false;
}

async function guardarImagem(ficheiro) {
  if (!ficheiro || !Buffer.isBuffer(ficheiro.buffer)) {
    throw erro(400, 'Nenhuma imagem enviada');
  }

  const extensao = TIPOS[ficheiro.mimetype];

  if (!extensao || !assinaturaValida(ficheiro)) {
    throw erro(
      400,
      'Formato inválido. Utilize JPEG, PNG ou WebP'
    );
  }

  if (
    ficheiro.buffer.length === 0 ||
    ficheiro.buffer.length > TAMANHO_MAXIMO
  ) {
    throw erro(400, 'A imagem deve ter no máximo 5 MB');
  }

  const nome = `${Date.now()}-${
    crypto.randomBytes(12).toString('hex')
  }${extensao}`;

  if (process.env.STORAGE_CONN) {
    const blob = obterContainer().getBlockBlobClient(nome);

    await blob.uploadData(ficheiro.buffer, {
      blobHTTPHeaders: {
        blobContentType: ficheiro.mimetype
      }
    });

    return blob.url;
  }

  await fs.mkdir(PASTA_UPLOADS, { recursive: true });

  await fs.writeFile(
    path.join(PASTA_UPLOADS, nome),
    ficheiro.buffer,
    { flag: 'wx' }
  );

  return `/uploads/${nome}`;
}

async function removerImagemLocal(imagemUrl) {
  if (
    typeof imagemUrl !== 'string' ||
    !imagemUrl.startsWith('/uploads/')
  ) {
    return false;
  }

  const nome = imagemUrl.slice('/uploads/'.length);

  if (!/^\d+-[a-f0-9]{24}\.(jpg|png|webp)$/.test(nome)) {
    return false;
  }

  const caminho = path.join(PASTA_UPLOADS, nome);

  try {
    await fs.unlink(caminho);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }

    throw err;
  }
}

module.exports = { guardarImagem, removerImagemLocal };
