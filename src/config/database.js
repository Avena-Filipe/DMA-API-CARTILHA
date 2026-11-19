const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL nao foi configurada no arquivo .env.');
  }

  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.DB_NAME || 'alunos'
  });

  console.log('MongoDB conectado com sucesso');
}

module.exports = connectDatabase;
