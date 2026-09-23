'use strict';

const express = require('express');
const { getTicket, getTicketQrImage, getTicketPdf, getCertificatePdf } = require('../controllers/publicTicketController');

const router = express.Router();

router.get('/:qrToken', getTicket);
router.get('/:qrToken/qr.png', getTicketQrImage);
router.get('/:qrToken/pdf', getTicketPdf);
router.get('/:qrToken/certificate.pdf', getCertificatePdf);

module.exports = router;
