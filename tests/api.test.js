const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.ADMIN_USER = 'admin-teste';
process.env.ADMIN_PASSWORD = 'senha-teste';
process.env.JWT_SECRET = 'segredo-comprido-apenas-para-testes-automatizados';
const { app } = require('../src/server');
const Aluno = require('../src/models/Aluno');
const id = '507f1f77bcf86cd799439011';
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
async function req(rota, method = 'GET', body, token) {
  const res = await fetch(base + rota, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function login() {
  const r = await req('/login','POST', { usuario:'admin-teste', senha:'senha-teste' });
  assert.equal(r.status,200);
  return r.json.token;
}
test('GET / serve o frontend', async () => {
  const r = await fetch(base + '/');
  assert.equal(r.status,200);
  assert.match(await r.text(), /CRUD de Alunos/);
});
test('login valido e invalido', async () => {
  assert.equal((await req('/login','POST',{usuario:'admin-teste',senha:'errada'})).status,401);
  assert.ok(await login());
});
test('POST, PUT e DELETE protegidos por token', async () => {
  assert.equal((await req('/alunos','POST',{nome:'Ana',curso:'ADS'})).status,401);
  assert.equal((await req('/alunos/' + id,'PUT',{nome:'Ana',curso:'ADS'})).status,401);
  assert.equal((await req('/alunos/' + id,'DELETE')).status,401);
});
test('GET /alunos consulta Mongoose', async () => {
  const stub = mock.method(Aluno,'find',async () => [{ _id:id,nome:'Ana',curso:'ADS' }]);
  try {
    const r = await req('/alunos');
    assert.equal(r.status,200);
    assert.equal(r.json[0]._id,id);
  } finally { stub.mock.restore(); }
});
test('POST cadastra nome e curso e valida dados', async () => {
  const token = await login();
  const stub = mock.method(Aluno,'create',async d => ({ _id:id,...d }));
  try {
    const r = await req('/alunos','POST',{nome:'Ana',curso:'ADS'},token);
    assert.equal(r.status,201);
    assert.equal(r.json._id,id);
    assert.equal((await req('/alunos','POST',{nome:'',curso:'ADS'},token)).status,400);
  } finally { stub.mock.restore(); }
});
test('PUT atualiza por _id', async () => {
  const token = await login();
  const stub = mock.method(Aluno,'findByIdAndUpdate',async (i,d) => ({ _id:i,...d }));
  try {
    const r = await req('/alunos/' + id,'PUT',{nome:'Ana Silva',curso:'ADS'},token);
    assert.equal(r.status,200);
    assert.equal(r.json.nome,'Ana Silva');
  } finally { stub.mock.restore(); }
});
test('DELETE remove por _id', async () => {
  const token = await login();
  const stub = mock.method(Aluno,'findByIdAndDelete',async () => ({ _id:id }));
  try { assert.equal((await req('/alunos/' + id,'DELETE',undefined,token)).status,200); }
  finally { stub.mock.restore(); }
});
test('ID malformado retorna 400', async () => {
  assert.equal((await req('/alunos/abc','DELETE',undefined,await login())).status,400);
});
