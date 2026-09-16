'use strict';

const storage = require('../storage/storageManager');
const cryptoUtils = require('../utils/crypto');
const config = require('../config');
const { generateId } = require('../utils/idGenerator');

const NAME = 'users';

async function getAllUsers() {
  return storage.readCollection(NAME);
}

async function findByUsername(username) {
  const users = await getAllUsers();
  return users.find(u => u.username.toLowerCase() === String(username).toLowerCase()) || null;
}

async function findById(id) {
  const users = await getAllUsers();
  return users.find(u => u.id === id) || null;
}

async function seedOwnerIfMissing() {
  const users = await getAllUsers();
  if (users.length === 0) {
    const owner = {
      id: generateId('user'),
      username: config.owner.username,
      email: config.owner.email,
      role: 'owner',
      passwordHash: cryptoUtils.hashPassword(config.owner.password),
      createdAt: new Date().toISOString()
    };
    await storage.writeCollection(NAME, [owner]);
    console.log(`[auth] Seeded owner account: ${owner.username}`);
  }
}

async function verifyCredentials(username, password) {
  const user = await findByUsername(username);
  if (!user) return null;
  if (!cryptoUtils.verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username, email: user.email, role: user.role };
}

async function updateProfile(id, { email, password }) {
  const users = await getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  if (typeof email === 'string' && email.trim()) {
    users[idx].email = email.trim();
  }
  if (typeof password === 'string' && password.length >= 6) {
    users[idx].passwordHash = cryptoUtils.hashPassword(password);
  }
  users[idx].updatedAt = new Date().toISOString();
  await storage.writeCollection(NAME, users);
  const u = users[idx];
  return { id: u.id, username: u.username, email: u.email, role: u.role };
}

module.exports = {
  getAllUsers,
  findByUsername,
  findById,
  seedOwnerIfMissing,
  verifyCredentials,
  updateProfile
};