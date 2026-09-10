import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  if (!password || !password.trim()) {
    return null;
  }
  return bcrypt.hash(password.trim(), 12);
}

export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}