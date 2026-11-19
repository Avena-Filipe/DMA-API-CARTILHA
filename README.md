# DMA-API-CARTILHA — CRUD de Alunos

Projeto acadêmico de API REST baseado na cartilha de Node.js, Express, Mongoose, MongoDB Atlas, autenticação JWT e frontend HTML/CSS/JavaScript.

Esta versão é independente da API original identificada pelo RA. O model utiliza nome e curso; a atualização e exclusão utilizam o _id do MongoDB.

## Executar

1. Instale Node.js 22 e Git.
2. Clone o repositório.
3. Execute npm ci.
4. Copie .env.example para .env e configure a URI do MongoDB Atlas, usuário e senha de login e segredo JWT.
5. Execute npm test e npm start.
6. Abra http://localhost:3003 no navegador.

Por padrão o arquivo de exemplo sugere DB_NAME=alunos_cartilha para não alterar dados da API antiga. Para utilizar alunos, como na cartilha, altere o DB_NAME conscientemente. Nunca publique o .env.

## Rotas

| Método | Rota | Token | Ação |
| --- | --- | --- | --- |
| GET | / | Não | Interface HTML |
| GET | /boas-vindas | Não | Mensagem de boas-vindas |
| GET | /alunos | Não | Listagem |
| POST | /login | Não | Gerar JWT |
| POST | /alunos | Sim | Cadastrar nome e curso |
| PUT | /alunos/:id | Sim | Editar pelo _id |
| DELETE | /alunos/:id | Sim | Excluir pelo _id |

O token deve ser enviado como Authorization: Bearer TOKEN. A autenticação com ADMIN_USER e ADMIN_PASSWORD é didática e não é adequada a produção.

## Testar e entregar

- npm run check: verifica sintaxe JavaScript.
- npm test: testes automatizados com mocks do Mongoose, sem acessar o Atlas.
- API-Cartilha.postman_collection.json: importe no Postman e execute as requisições na ordem. Preencha a senha do seu .env no login.
- No navegador, valide login, cadastro, listagem em tabela, edição e exclusão.
- Confira a aba Actions no GitHub e entregue ao professor o link deste repositório depois dos testes reais.

Se credenciais do Atlas foram expostas no histórico de outro repositório, troque a senha do usuário do Atlas. O projeto de cadastro de tecnologias é uma atividade separada.
