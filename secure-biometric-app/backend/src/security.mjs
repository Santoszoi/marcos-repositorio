import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const token = () => randomBytes(32).toString('hex');
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [, salt, expected] = encoded.split('$');
  const key = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const target = Buffer.from(expected, 'hex');
  return target.length === key.length && timingSafeEqual(key, target);
}
export function validPassword(value) {
  return typeof value === 'string' && value.length >= 10 && value.length <= 128;
}
export function email(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw Object.assign(new Error('Informe um e-mail válido.'), {status: 400});
  return normalized;
}
export function name(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length < 2 || normalized.length > 80) throw Object.assign(new Error('O nome deve ter de 2 a 80 caracteres.'), {status: 400});
  return normalized;
}
