const express = require('express');
const store = require('../services/keyStore');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

router.post('/login', rateLimit({ max: 15 }), (req, res) => {
  const record = store.findByKey(req.body && req.body.key);

  if (!record || record.status !== 'active') {
    return res.status(401).json({ error: 'Key inválida o revocada' });
  }

  res.cookie('license_key', record.key, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
  });
  store.touch(record);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie('license_key');
  res.json({ ok: true });
});

module.exports = router;
