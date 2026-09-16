'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = config.paths.data;

// In-process write queues to serialize writes per file
const writeQueues = new Map();

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readRaw(name, fallback) {
  ensureDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    writeRawSync(name, fallback);
    return fallback;
  }
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[storage] Failed to parse ${name}.json, using fallback.`, err.message);
    // backup corrupt file
    try {
      fs.copyFileSync(fp, `${fp}.corrupt.${Date.now()}`);
    } catch (_) {}
    return fallback;
  }
}

function writeRawSync(name, data) {
  ensureDir();
  const fp = filePath(name);
  const tmp = `${fp}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, fp);
}

function writeRaw(name, data) {
  return new Promise((resolve, reject) => {
    const prev = writeQueues.get(name) || Promise.resolve();
    const next = prev
      .catch(() => {})
      .then(() => {
        try {
          writeRawSync(name, data);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    writeQueues.set(name, next);
  });
}

async function readCollection(name) {
  const data = readRaw(name, []);
  return Array.isArray(data) ? data : [];
}

async function writeCollection(name, arr) {
  if (!Array.isArray(arr)) throw new Error('writeCollection expects array');
  await writeRaw(name, arr);
  return arr;
}

async function readObject(name, fallback = {}) {
  const data = readRaw(name, fallback);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : fallback;
}

async function writeObject(name, obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('writeObject expects object');
  }
  await writeRaw(name, obj);
  return obj;
}

module.exports = {
  readCollection,
  writeCollection,
  readObject,
  writeObject,
  ensureDir,
  DATA_DIR
};