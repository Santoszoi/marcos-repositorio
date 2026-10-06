# API REST v1

JSON em todas as requisições. Autenticação: `Authorization: Bearer <token>`.
As respostas de erro usam `{ "message": "mensagem" }` e código HTTP 400/401/403/404/409/413/415/429/500.

| Método | Rota | Dados | Acesso |
|---|---|---|---|
| GET | /health | nenhum | Público |
| POST | /v1/auth/register | name, email, password | Público |
| POST | /v1/auth/login | email, password | Público |
| POST | /v1/auth/forgot-password | email | Público |
| POST | /v1/auth/reset-password | code, password | Público |
| POST | /v1/auth/logout | {} | Conta |
| GET | /v1/me | nenhum | Conta |
| PATCH | /v1/me | name | Conta |
| POST | /v1/me/password | currentPassword, password | Conta |
| DELETE | /v1/me | password | Conta |
| GET | /v1/admin/users?offset=0 | nenhum | Administrador |
| PATCH | /v1/admin/users/{id} | active (booleano) | Administrador |
| GET | /v1/admin/audit | nenhum | Administrador |

Cadastro e login retornam `{token, expiresAt, user}`. `user` contém id, name,
email, role, active e createdAt. Datas são milissegundos Unix.
GET/PATCH de perfil retornam `{user}`. Listagem administrativa retorna
`{users, total, offset}`, 50 usuários por página. Auditoria retorna `{events}`,
até 100 eventos. As demais operações retornam `{message}`.

Código de recuperação: 64 caracteres hexadecimais aleatórios, validade de
15 minutos, uso único. Só o hash fica no banco. A resposta de solicitação
nunca expõe o código ou confirma se o e-mail existe. Novo código invalida o anterior.
Após recuperação/troca de senha, suspensão ou exclusão, todas as sessões são revogadas.
A sessão dura 7 dias. Após expirar, o usuário deve entrar novamente com a senha.

Papéis não são aceitos no cadastro ou edição de perfil. A criação de administrador
ocorre somente pelo comando no servidor. O app não pode promover contas.
