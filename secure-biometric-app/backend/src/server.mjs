import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { audit, publicUser, transaction } from './database.mjs';
import { digest, token, hashPassword, verifyPassword, validPassword, email, name } from './security.mjs';
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function password(value) { if (!validPassword(value)) fail(400, 'A senha deve ter entre 10 e 128 caracteres.'); return value; }
async function body(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'Envie JSON.');
  let data = ''; let length = 0;
  for await (const chunk of req) { length += chunk.length; if (length > 16384) fail(413, 'Requisição muito grande.'); data += chunk; }
  try { const value = JSON.parse(data); if (!value || Array.isArray(value) || typeof value !== 'object') fail(400, 'JSON inválido.'); return value; }
  catch { fail(400, 'JSON inválido.'); }
}
export async function createApi({ db, sendReset, now = Date.now, rateLimit = 20, trustProxy = false, onError = console.error }) {
  // A fake hash equalizes the expensive operation for unknown accounts.
  const dummyHash = await hashPassword(token());
  const buckets = new Map();
  const duration = 15 * 60 * 1000;
  function limited(key, maximum = rateLimit) {
    const current = now();
    let entry = buckets.get(key);
    if (!entry || entry.until <= current) { entry = { count: 0, until: current + duration }; buckets.set(key, entry); }
    if (++entry.count > maximum) fail(429, 'Muitas tentativas. Aguarde 15 minutos.');
  }
  const cleanup = setInterval(() => {
    for (const [key, value] of buckets) if (value.until <= now()) buckets.delete(key);
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    db.prepare('DELETE FROM resets WHERE expires_at <= ?').run(now());
  }, 60000);
  cleanup.unref();
  function authenticated(req) {
    const raw = (req.headers.authorization || '').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    const user = raw && db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires_at>? AND u.active=1').get(digest(raw), now());
    if (!user) fail(401, 'Sessão expirada. Entre novamente.');
    return { user, hash: digest(raw) };
  }
  function session(user) {
    const raw = token(); const expiresAt = now() + 7 * 24 * 60 * 60 * 1000;
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(raw), user.id, expiresAt);
    return {token: raw, expiresAt, user: publicUser(user)};
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    const send = (status, value) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      const method = req.method;
      if (path === '/health' && method === 'GET') { db.prepare('SELECT 1').get(); return send(200, {status: 'ok'}); }
      if (!path.startsWith('/v1/')) fail(404, 'Rota não encontrada.');
      // Forwarded headers are accepted ONLY behind an explicitly trusted proxy.
      const ip = trustProxy ? String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim() : req.socket.remoteAddress;
      limited(`all:${ip}`);
      if (['/v1/auth/login', '/v1/auth/register', '/v1/auth/forgot-password', '/v1/auth/reset-password'].includes(path)) limited(`auth-ip:${ip}`, Math.min(rateLimit, 20));
      if (path === '/v1/auth/register' && method === 'POST') {
        const data = await body(req); const address = email(data.email); const display = name(data.name);
        const hash = await hashPassword(password(data.password));
        const user = {id: randomUUID(), name: display, email: address, password_hash: hash, role: 'user', active: 1, created_at: now()};
        if (db.prepare('SELECT 1 FROM users WHERE email=?').get(address)) fail(409, 'Não foi possível cadastrar. Tente entrar ou recuperar a senha.');
        transaction(db, () => {
          db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)').run(user.id, user.name, address, hash, 'user', 1, user.created_at);
          audit(db, user.id, 'account.created', user.id);
        });
        return send(201, session(user));
      }
      if (path === '/v1/auth/login' && method === 'POST') {
        const data = await body(req); const address = email(data.email);
        limited(`login:${digest(address)}`, Math.min(rateLimit, 10));
        const row = db.prepare('SELECT * FROM users WHERE email=?').get(address);
        const supplied = typeof data.password === 'string' && data.password.length <= 128 ? data.password : '';
        const valid = await verifyPassword(supplied, row?.password_hash || dummyHash);
        const current = row && db.prepare('SELECT * FROM users WHERE id=?').get(row.id);
        if (!valid || !current?.active || current.password_hash !== row.password_hash) fail(401, 'E-mail ou senha inválidos.');
        audit(db, row.id, 'account.login', row.id);
        return send(200, session(current));
      }
      if (path === '/v1/auth/forgot-password' && method === 'POST') {
        const data = await body(req); const address = email(data.email);
        limited(`reset:${digest(address)}`, Math.min(rateLimit, 3));
        const row = db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(address);
        if (row) {
          const raw = token(); const hash = digest(raw);
          db.prepare('INSERT INTO resets VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET hash=excluded.hash, expires_at=excluded.expires_at').run(hash, row.id, now() + duration);
          // Schedule delivery so account existence cannot be inferred from SMTP latency.
          setImmediate(async () => {
            try { await sendReset(address, raw); }
            catch (error) { db.prepare('DELETE FROM resets WHERE hash=?').run(hash); onError('Falha no envio de recuperação:', error.message); }
          });
        }
        return send(200, {message: 'Se houver uma conta ativa, você receberá as instruções de recuperação.'});
      }
      if (path === '/v1/auth/reset-password' && method === 'POST') {
        const data = await body(req); password(data.password);
        if (typeof data.code !== 'string' || !/^[a-f0-9]{64}$/.test(data.code)) fail(400, 'Código inválido ou expirado.');
        const hash = await hashPassword(data.password);
        // Recheck and consume inside one transaction, including concurrent requests.
        transaction(db, () => {
          const reset = db.prepare('SELECT r.* FROM resets r JOIN users u ON u.id=r.user_id WHERE r.hash=? AND r.expires_at>? AND u.active=1').get(digest(data.code), now());
          if (!reset) fail(400, 'Código inválido ou expirado.');
          db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, reset.user_id);
          db.prepare('DELETE FROM resets WHERE user_id=?').run(reset.user_id);
          db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
          audit(db, reset.user_id, 'password.reset', reset.user_id);
        });
        return send(200, {message: 'Senha alterada. Entre novamente.'});
      }
      const { user, hash } = authenticated(req);
      if (path === '/v1/auth/logout' && method === 'POST') { db.prepare('DELETE FROM sessions WHERE hash=?').run(hash); return send(200, {message: 'Você saiu da conta.'}); }
      if (path === '/v1/me' && method === 'GET') return send(200, {user: publicUser(user)});
      if (path === '/v1/me' && method === 'PATCH') {
        const data = await body(req); const display = name(data.name);
        db.prepare('UPDATE users SET name=? WHERE id=?').run(display, user.id);
        audit(db, user.id, 'profile.updated', user.id);
        return send(200, {user: publicUser({...user, name: display})});
      }
      if (path === '/v1/me/password' && method === 'POST') {
        const data = await body(req); password(data.password);
        if (typeof data.currentPassword !== 'string' || data.currentPassword.length > 128 || !await verifyPassword(data.currentPassword, user.password_hash)) fail(403, 'Senha atual incorreta.');
        const updated = await hashPassword(data.password);
        transaction(db, () => {
          db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(updated, user.id);
          db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
          db.prepare('DELETE FROM resets WHERE user_id=?').run(user.id);
          audit(db, user.id, 'password.changed', user.id);
        });
        return send(200, {message: 'Senha alterada. Entre novamente.'});
      }
      if (path === '/v1/me' && method === 'DELETE') {
        const data = await body(req);
        if (typeof data.password !== 'string' || data.password.length > 128 || !await verifyPassword(data.password, user.password_hash)) fail(403, 'Senha incorreta.');
        transaction(db, () => { db.prepare('DELETE FROM users WHERE id=?').run(user.id); audit(db, null, 'account.deleted'); });
        return send(200, {message: 'Conta excluída.'});
      }
      if (path.startsWith('/v1/admin/')) {
        if (user.role !== 'admin') fail(403, 'Acesso restrito ao administrador.');
        if (path === '/v1/admin/users' && method === 'GET') {
          const params = new URL(req.url, 'http://localhost').searchParams;
          const offset = Math.max(0, Math.min(100000, Number(params.get('offset')) || 0));
          const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC, id LIMIT 50 OFFSET ?').all(offset).map(publicUser);
          return send(200, {users, total: db.prepare('SELECT COUNT(*) AS count FROM users').get().count, offset});
        }
        if (path === '/v1/admin/audit' && method === 'GET') return send(200, {events: db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all()});
        const match = path.match(/^\/v1\/admin\/users\/([a-f0-9-]+)$/);
        if (match && method === 'PATCH') {
          const data = await body(req); const target = db.prepare('SELECT * FROM users WHERE id=?').get(match[1]);
          if (!target) fail(404, 'Usuário não encontrado.');
          if (target.role === 'admin') fail(403, 'Administradores só podem ser gerenciados pelo servidor.');
          if (typeof data.active !== 'boolean') fail(400, 'Informe o estado da conta.');
          transaction(db, () => {
            db.prepare('UPDATE users SET active=? WHERE id=?').run(data.active ? 1 : 0, target.id);
            if (!data.active) { db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id); db.prepare('DELETE FROM resets WHERE user_id=?').run(target.id); }
            audit(db, user.id, data.active ? 'account.enabled' : 'account.disabled', target.id);
          });
          return send(200, {user: publicUser({...target, active: data.active})});
        }
      }
      fail(404, 'Rota não encontrada.');
    } catch (error) {
      if (!error.status) onError('Falha interna:', error.message);
      if (!res.headersSent) send(error.status || 500, {message: error.status ? error.message : 'Não foi possível concluir. Tente novamente.'});
      else res.end();
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  server.on('close', () => clearInterval(cleanup));
  return server;
}
