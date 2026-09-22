'use strict';

const express = require('express');
const { getTicket, getTicketQrImage, getTicketPdf } = require('../controllers/publicTicketController');

const router = express.Router();

router.get('/:qrToken', getTicket);
router.get('/:qrToken/qr.png', getTicketQrImage);
router.get('/:qrToken/pdf', getTicketPdf);

module.exports = router;
