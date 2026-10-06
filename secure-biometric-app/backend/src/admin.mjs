import { randomUUID } from 'node:crypto';
import { openDatabase, audit } from './database.mjs';
import { hashPassword, validPassword, name, email } from './security.mjs';
const display = name(process.env.ADMIN_NAME || 'Marcos');
const address = email(process.env.ADMIN_EMAIL);
if (!validPassword(process.env.ADMIN_PASSWORD)) throw new Error('Defina ADMIN_PASSWORD com 10 a 128 caracteres.');
const db = openDatabase(process.env.DB_PATH);
try {
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(address)) throw new Error('Este e-mail já existe. O comando não altera contas existentes.');
  const id = randomUUID();
  db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, display, address, await hashPassword(process.env.ADMIN_PASSWORD), 'admin', 1, Date.now());
  audit(db, id, 'admin.created', id);
  console.info('Administrador Marcos criado. Remova ADMIN_PASSWORD do ambiente após esta operação.');
} finally { db.close(); }
