import { openDatabase } from './database.mjs';
import { createMailer } from './mailer.mjs';
import { createApi } from './server.mjs';
const db = openDatabase(process.env.DB_PATH);
const sendReset = await createMailer();
const server = await createApi({db, sendReset, rateLimit: 300, trustProxy: process.env.TRUST_PROXY === 'true'});
server.listen(Number(process.env.PORT || 8080), process.env.HOST || '127.0.0.1', () => console.info(`API na porta ${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
