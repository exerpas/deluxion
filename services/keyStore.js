const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'keys.json');

let keys = [];

function load() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(FILE)) keys = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (err) {
    console.error('No se pudo leer keys.json, se inicia vacío:', err.message);
    keys = [];
  }
}

function save() {
  try {
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(keys, null, 2));
    fs.renameSync(tmp, FILE); // escritura atómica
  } catch (err) {
    console.error('No se pudo guardar keys.json:', err.message);
  }
}

const KEY_PREFIX = 'OCTOBER';
const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomChars(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += KEY_ALPHABET[crypto.randomInt(KEY_ALPHABET.length)];
  return out;
}

// Formato: OCTOBER-XXXX-XXXXXXXXXXXX (A-Z y 0-9, generado con crypto.randomInt)
function generateKey() {
  return `${KEY_PREFIX}-${randomChars(4)}-${randomChars(12)}`;
}

function list() {
  return [...keys].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function create(label = '') {
  const record = {
    id: crypto.randomUUID(),
    key: generateKey(),
    label: String(label).slice(0, 60),
    status: 'active', // 'active' | 'revoked'
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };
  keys.push(record);
  save();
  return record;
}

function findByKey(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return keys.find((k) => k.key === normalized) || null;
}

function setStatus(id, status) {
  const record = keys.find((k) => k.id === id);
  if (!record) return null;
  record.status = status;
  save();
  return record;
}

function remove(id) {
  const index = keys.findIndex((k) => k.id === id);
  if (index === -1) return false;
  keys.splice(index, 1);
  save();
  return true;
}

function touch(record) {
  record.lastUsedAt = new Date().toISOString(); // solo en memoria; se persiste en el siguiente save()
}

load();

module.exports = { list, create, findByKey, setStatus, remove, touch };
