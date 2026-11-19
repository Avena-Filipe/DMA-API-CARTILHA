'use strict';
let token = '';
let alunos = [];
const ids = ['formLogin','formAluno','listaAlunos','mensagem','statusLogin','usuario','senha','nome','curso','alunoId','salvar'];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const aviso = (mensagem, tipo='') => { el.mensagem.textContent = mensagem; el.mensagem.className = tipo; };
const statusLogin = () => {
  el.statusLogin.textContent = token ? 'Autenticado' : 'Não autenticado';
  el.statusLogin.classList.toggle('ativo', Boolean(token));
};
const headers = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) });

async function api(rota, opcoes={}) {
  const resposta = await fetch(rota, opcoes);
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 401 && token) { token=''; statusLogin(); }
    throw new Error(dados.mensagem || 'Erro HTTP '+resposta.status);
  }
  return dados;
}

function limpar() {
  el.formAluno.reset(); el.alunoId.value=''; el.salvar.textContent='Cadastrar';
}

function iniciarEdicao(id) {
  const aluno = alunos.find(a => a._id === id);
  if (!aluno) return;
  el.alunoId.value=aluno._id; el.nome.value=aluno.nome; el.curso.value=aluno.curso;
  el.salvar.textContent='Salvar alterações'; el.nome.focus();
}

async function remover(id) {
  if (!token) return aviso('Faça login antes de excluir.', 'erro');
  if (!confirm('Deseja realmente excluir este aluno?')) return;
  try {
    await api('/alunos/'+encodeURIComponent(id), {method:'DELETE',headers:{Authorization:'Bearer '+token}});
    limpar(); await listar(false); aviso('Aluno excluído com sucesso.', 'sucesso');
  } catch(error) { aviso(error.message,'erro'); }
}

function celula(linha, texto) {
  const td=document.createElement('td'); td.textContent=texto || ''; linha.appendChild(td);
}
async function listar(limparAviso=true) {
  try {
    alunos=await api('/alunos'); el.listaAlunos.replaceChildren();
    if (!alunos.length) {
      const tr=document.createElement('tr'),td=document.createElement('td');
      td.colSpan=3;td.textContent='Nenhum aluno cadastrado.';
      tr.appendChild(td);el.listaAlunos.appendChild(tr);
    }
    alunos.forEach(aluno => {
      const tr=document.createElement('tr');
      celula(tr,aluno.nome);celula(tr,aluno.curso);
      const td=document.createElement('td');td.className='acoes';
      const editar=document.createElement('button');editar.className='secundario';editar.textContent='Editar';
      editar.addEventListener('click',()=>iniciarEdicao(aluno._id));
      const excluir=document.createElement('button');excluir.className='perigo';excluir.textContent='Excluir';
      excluir.addEventListener('click',()=>remover(aluno._id));
      td.append(editar,excluir);tr.appendChild(td);el.listaAlunos.appendChild(tr);
    });
    if (limparAviso) aviso('');
  } catch(error) { aviso('Erro ao listar alunos: '+error.message,'erro'); }
}
el.formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const r=await api('/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({usuario:el.usuario.value,senha:el.senha.value})});
    token=r.token;el.senha.value='';statusLogin();aviso('Login realizado.','sucesso');
  } catch(error) { aviso(error.message,'erro'); }
});
el.formAluno.addEventListener('submit', async e => {
  e.preventDefault();
  if (!token) return aviso('Faça login antes de salvar.','erro');
  const id=el.alunoId.value;
  try {
    await api(id?'/alunos/'+encodeURIComponent(id):'/alunos',{
      method:id?'PUT':'POST',headers:headers(),
      body:JSON.stringify({nome:el.nome.value.trim(),curso:el.curso.value.trim()})
    });
    limpar();await listar(false);aviso('Aluno salvo com sucesso.','sucesso');
  } catch(error) { aviso(error.message,'erro'); }
});
document.getElementById('cancelarEdicao').addEventListener('click',limpar);
document.getElementById('recarregar').addEventListener('click',()=>listar());
document.getElementById('sair').addEventListener('click',()=>{token='';statusLogin();aviso('Sessão encerrada.');});
statusLogin();listar();
