// GET /api/indicadores — HU-10, Sprint 3.
const express = require('express');

const router = express.Router();

router.get('/', (req, res) =>
  res.status(501).json({ error: 'No implementado todavía (HU-10 Indicadores)' })
);

module.exports = router;
