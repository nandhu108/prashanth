'use strict';

const express = require('express');
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/publicPaymentController');

const router = express.Router();

router.post('/orders', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

module.exports = router;
