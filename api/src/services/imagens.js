
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');
const erro = require('../utils/erro');

const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

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
let clienteS3;

function obterClienteS3() {
  const campos = [
    'SUPABASE_S3_ENDPOINT',
    'SUPABASE_S3_REGION',
    'SUPABASE_S3_ACCESS_KEY_ID',
    'SUPABASE_S3_SECRET_ACCESS_KEY',
    'SUPABASE_URL'
  ];

  const emFalta = campos.filter(
    (campo) => !process.env[campo]
  );

  if (emFalta.length > 0) {
    throw new Error(
      `Configuração Supabase incompleta: ${emFalta.join(', ')}`
    );
  }

  if (!clienteS3) {
    clienteS3 = new S3Client({
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      region: process.env.SUPABASE_S3_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY
      }
    });
  }

  return clienteS3;
}

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

  const usarSupabase = [
    'SUPABASE_S3_ENDPOINT',
    'SUPABASE_S3_REGION',
    'SUPABASE_S3_ACCESS_KEY_ID',
    'SUPABASE_S3_SECRET_ACCESS_KEY',
    'SUPABASE_URL'
  ].some((campo) => Boolean(process.env[campo]));

  if (usarSupabase) {
    const cliente = obterClienteS3();

    const bucket =
      process.env.SUPABASE_S3_BUCKET || 'produtos';

    await cliente.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: nome,
        Body: ficheiro.buffer,
        ContentType: ficheiro.mimetype
      })
    );

    const baseUrl = process.env.SUPABASE_URL
      .replace(/\/+$/, '');

    return (
      `${baseUrl}/storage/v1/object/public/` +
      `${encodeURIComponent(bucket)}/${encodeURIComponent(nome)}`
    );
  }

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
