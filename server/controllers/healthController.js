'use strict';

const storage = require('../storage/storageManager');
const fs = require('fs');

function health(req, res) {
  const dataDirOk = fs.existsSync(storage.DATA_DIR);
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    storage: dataDirOk ? 'ready' : 'missing',
    timestamp: new Date().toISOString()
  });
}

module.exports = { health };