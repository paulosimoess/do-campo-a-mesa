module.exports = (status, mensagem) =>
  Object.assign(new Error(mensagem), { status });