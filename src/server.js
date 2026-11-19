require('dotenv').config();
const express = require('express');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDatabase = require('./config/database');
const Aluno = require('./models/Aluno');
const verificarToken = require('./middlewares/auth');

const app = express();
const PORT = Number(process.env.PORT || 3003);
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/boas-vindas', (req, res) => res.send('SEJA BEM VINDO!'));

app.post('/login', (req, res) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(503).json({ mensagem: 'Configure as credenciais no .env.' });
  }
  const { usuario, senha } = req.body || {};
  if (usuario !== process.env.ADMIN_USER || senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ mensagem: 'Usuario ou senha invalidos.' });
  }
  const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  return res.status(200).json({ token });
});

function erroBanco(res, error, mensagem) {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ mensagem: 'Dados invalidos.', detalhe: error.message });
  }
  console.error(mensagem, error.message);
  return res.status(500).json({ mensagem });
}

app.get('/alunos', async (req, res) => {
  try { return res.status(200).json(await Aluno.find()); }
  catch (error) { return erroBanco(res, error, 'Erro ao buscar alunos.'); }
});

app.post('/alunos', verificarToken, async (req, res) => {
  const { nome, curso } = req.body || {};
  if (typeof nome !== 'string' || !nome.trim() || typeof curso !== 'string' || !curso.trim()) {
    return res.status(400).json({ mensagem: 'Informe nome e curso.' });
  }
  try {
    const aluno = await Aluno.create({ nome: nome.trim(), curso: curso.trim() });
    return res.status(201).json(aluno);
  } catch (error) { return erroBanco(res, error, 'Erro ao cadastrar aluno.'); }
});

app.put('/alunos/:id', verificarToken, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID invalido.' });
  }
  const { nome, curso } = req.body || {};
  if (typeof nome !== 'string' || !nome.trim() || typeof curso !== 'string' || !curso.trim()) {
    return res.status(400).json({ mensagem: 'Informe nome e curso.' });
  }
  try {
    const aluno = await Aluno.findByIdAndUpdate(req.params.id,
      { nome: nome.trim(), curso: curso.trim() },
      { returnDocument: 'after', runValidators: true });
    if (!aluno) return res.status(404).json({ mensagem: 'Aluno nao encontrado.' });
    return res.status(200).json(aluno);
  } catch (error) { return erroBanco(res, error, 'Erro ao atualizar aluno.'); }
});

app.delete('/alunos/:id', verificarToken, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID invalido.' });
  }
  try {
    const removido = await Aluno.findByIdAndDelete(req.params.id);
    if (!removido) return res.status(404).json({ mensagem: 'Aluno nao encontrado.' });
    return res.status(200).json({ mensagem: 'Aluno excluido com sucesso.' });
  } catch (error) { return erroBanco(res, error, 'Erro ao excluir aluno.'); }
});

app.use((error, req, res, next) => {
  if (error && error.type === 'entity.parse.failed') return res.status(400).json({ mensagem: 'JSON invalido.' });
  console.error('Erro inesperado:', error?.message);
  return res.status(500).json({ mensagem: 'Erro interno.' });
});

async function startServer() {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT invalida.');
  if (!process.env.MONGO_URL || !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    throw new Error('Configure MONGO_URL, ADMIN_USER, ADMIN_PASSWORD e JWT_SECRET no .env.');
  }
  await connectDatabase();
  return app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
}
if (require.main === module) startServer().catch(error => {
  console.error('Nao foi possivel iniciar a API:', error.message); process.exitCode = 1;
});
module.exports = { app, startServer };
