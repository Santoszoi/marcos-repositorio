import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../src/database.mjs';
import { createApi } from '../src/server.mjs';
import { hashPassword } from '../src/security.mjs';
async function setup(t, options = {}) {
  const db = openDatabase(':memory:'); const mail = []; let time = Date.now();
  const server = await createApi({db, sendReset: async (email, code) => mail.push({email, code}), now: () => time, rateLimit: 500, onError: console.error, ...options});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, method = 'GET', data, token) => {
    const result = await fetch(base + path, {method, headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})}, ...(data ? {body: JSON.stringify(data)} : {})});
    return {status: result.status, data: await result.json(), headers: result.headers};
  };
  const register = (email = 'marcos@example.com') => call('/v1/auth/register', 'POST', {name: 'Marcos', email, password: 'SenhaTeste123!'});
  return {db, mail, call, register, advance: ms => time += ms};
}
test('cadastro, login, perfil, hash e revogação de sessão', async t => {
  const {db, call, register} = await setup(t);
  const created = await register(); assert.equal(created.status, 201);
  assert.equal(created.data.user.role, 'user'); assert.equal(created.data.user.name, 'Marcos');
  assert.equal(created.data.user.password_hash, undefined);
  const row = db.prepare('SELECT * FROM users').get(); assert.notEqual(row.password_hash, 'SenhaTeste123!'); assert.match(row.password_hash, /^scrypt\$/);
  assert.notEqual(db.prepare('SELECT * FROM sessions').get().hash, created.data.token);
  assert.equal((await call('/v1/me')).status, 401);
  assert.equal((await call('/v1/me', 'PATCH', {name: 'Marcos Neves'}, created.data.token)).data.user.name, 'Marcos Neves');
  assert.equal((await register()).status, 409);
  assert.equal((await call('/v1/auth/login', 'POST', {email: row.email, password: 'errada'})).status, 401);
  const login = await call('/v1/auth/login', 'POST', {email: row.email.toUpperCase(), password: 'SenhaTeste123!'}); assert.equal(login.status, 200);
  assert.equal((await call('/v1/auth/logout', 'POST', {}, login.data.token)).status, 200);
  assert.equal((await call('/v1/me', 'GET', null, login.data.token)).status, 401);
});
test('recuperação não revela conta, expira, só funciona uma vez e revoga sessões', async t => {
  const {call, register, mail, advance} = await setup(t); const user = (await register()).data;
  const a = await call('/v1/auth/forgot-password', 'POST', {email: user.user.email});
  const b = await call('/v1/auth/forgot-password', 'POST', {email: 'ausente@example.com'});
  assert.deepEqual(a.data, b.data); assert.equal(a.data.code, undefined);
  await new Promise(resolve => setImmediate(resolve)); assert.equal(mail.length, 1);
  const code = mail[0].code;
  assert.equal((await call('/v1/auth/reset-password', 'POST', {code, password: 'NovaSenha123!'})).status, 200);
  assert.equal((await call('/v1/me', 'GET', null, user.token)).status, 401);
  assert.equal((await call('/v1/auth/reset-password', 'POST', {code, password: 'OutraSenha123!'})).status, 400);
  assert.equal((await call('/v1/auth/login', 'POST', {email: user.user.email, password: 'SenhaTeste123!'})).status, 401);
  assert.equal((await call('/v1/auth/login', 'POST', {email: user.user.email, password: 'NovaSenha123!'})).status, 200);
  await call('/v1/auth/forgot-password', 'POST', {email: user.user.email}); await new Promise(resolve => setImmediate(resolve));
  advance(16 * 60 * 1000);
  assert.equal((await call('/v1/auth/reset-password', 'POST', {code: mail[1].code, password: 'OutraSenha123!'})).status, 400);
});
test('consumo concorrente do código é atômico', async t => {
  const {call, register, mail} = await setup(t); const user = (await register()).data;
  await call('/v1/auth/forgot-password', 'POST', {email: user.user.email}); await new Promise(resolve => setImmediate(resolve));
  const responses = await Promise.all([1, 2].map(() => call('/v1/auth/reset-password', 'POST', {code: mail[0].code, password: 'NovaSenha123!'})));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
});
test('permissões administrativas, suspensão, reativação e auditoria', async t => {
  const {call, register, db} = await setup(t); const user = (await register()).data;
  assert.equal((await call('/v1/admin/users', 'GET', null, user.token)).status, 403);
  assert.equal((await call('/v1/me', 'PATCH', {name: 'Marcos', role: 'admin'}, user.token)).data.user.role, 'user');
  db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), 'Marcos', 'admin@example.com', await hashPassword('AdminSenha123!'), 'admin', 1, Date.now());
  const admin = (await call('/v1/auth/login', 'POST', {email: 'admin@example.com', password: 'AdminSenha123!'})).data;
  const users = await call('/v1/admin/users', 'GET', null, admin.token); assert.equal(users.data.total, 2); assert.equal(users.data.users[0].password_hash, undefined);
  assert.equal((await call(`/v1/admin/users/${admin.user.id}`, 'PATCH', {active: false}, admin.token)).status, 403);
  assert.equal((await call(`/v1/admin/users/${user.user.id}`, 'PATCH', {active: false}, admin.token)).status, 200);
  assert.equal((await call('/v1/me', 'GET', null, user.token)).status, 401);
  assert.equal((await call('/v1/auth/login', 'POST', {email: user.user.email, password: 'SenhaTeste123!'})).status, 401);
  await call(`/v1/admin/users/${user.user.id}`, 'PATCH', {active: true}, admin.token);
  assert.equal((await call('/v1/auth/login', 'POST', {email: user.user.email, password: 'SenhaTeste123!'})).status, 200);
  assert.ok((await call('/v1/admin/audit', 'GET', null, admin.token)).data.events.some(e => e.action === 'account.disabled'));
});
test('troca de senha e exclusão exigem senha atual e removem sessões', async t => {
  const {call, register, db} = await setup(t); const user = (await register()).data;
  assert.equal((await call('/v1/me/password', 'POST', {currentPassword: 'errada', password: 'NovaSenha123!'}, user.token)).status, 403);
  assert.equal((await call('/v1/me/password', 'POST', {currentPassword: 'SenhaTeste123!', password: 'NovaSenha123!'}, user.token)).status, 200);
  assert.equal((await call('/v1/me', 'GET', null, user.token)).status, 401);
  const login = (await call('/v1/auth/login', 'POST', {email: user.user.email, password: 'NovaSenha123!'})).data;
  assert.equal((await call('/v1/me', 'DELETE', {password: 'errada'}, login.token)).status, 403);
  assert.equal((await call('/v1/me', 'DELETE', {password: 'NovaSenha123!'}, login.token)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM sessions').get().n, 0);
});
test('validação, expiração, headers e limite de tentativas', async t => {
  const {call, register, advance} = await setup(t, {rateLimit: 5});
  const health = await call('/health'); assert.equal(health.status, 200); assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await call('/v1/auth/register', 'POST', {name: 'Marcos', email: 'x', password: 'curta'})).status, 400);
  const user = (await register()).data; advance(8 * 24 * 60 * 60 * 1000);
  assert.equal((await call('/v1/me', 'GET', null, user.token)).status, 401);
  for (let i = 0; i < 5; i++) await call('/v1/auth/login', 'POST', {email: 'x@example.com', password: 'errada'});
  assert.equal((await call('/v1/auth/login', 'POST', {email: 'x@example.com', password: 'errada'})).status, 429);
});
