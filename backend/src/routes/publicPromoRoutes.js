'use strict';

const express = require('express');
const { validatePromoCode } = require('../controllers/publicPromoController');

const router = express.Router();

router.post('/validate', validatePromoCode);

module.exports = router;
