import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
export async function createMailer(env = process.env) {
  if (env.NODE_ENV === 'production' && (!env.SMTP_HOST || !env.SMTP_FROM || !env.SMTP_USER || !env.SMTP_PASS)) {
    throw new Error('Configure SMTP_HOST, SMTP_FROM, SMTP_USER e SMTP_PASS em produção.');
  }
  if (env.SMTP_HOST) {
    const { default: nodemailer } = await import('nodemailer');
    const transport = nodemailer.createTransport({host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 465), secure: env.SMTP_TLS !== 'false', auth: {user: env.SMTP_USER, pass: env.SMTP_PASS}, requireTLS: true});
    await transport.verify();
    return async (address, code) => transport.sendMail({from: env.SMTP_FROM, to: address, subject: 'Recuperação de senha | Marcos Solutions', text: `Seu código de recuperação é:\n\n${code}\n\nAbra o aplicativo, toque em Recuperar senha e depois em Já tenho um código. Cole o código e defina a nova senha. Ele expira em 15 minutos e só pode ser usado uma vez. Se você não solicitou, ignore este e-mail.`});
  }
  const outbox = env.OUTBOX_PATH || 'data/outbox';
  mkdirSync(outbox, {recursive: true, mode: 0o700});
  console.info('Modo local: e-mails são gravados em data/outbox. Não existe envio externo.');
  return async (address, code) => writeFileSync(join(outbox, `${randomUUID()}.json`), JSON.stringify({to: address, code, expiresInMinutes: 15}, null, 2), {mode: 0o600});
}
