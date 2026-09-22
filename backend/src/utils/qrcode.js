'use strict';

const QRCode = require('qrcode');

/** PNG buffer, suitable for streaming as an image/png response or embedding in a PDF. */
function generateQrPngBuffer(text) {
  return QRCode.toBuffer(text, { type: 'png', margin: 1, width: 360, errorCorrectionLevel: 'M' });
}

module.exports = { generateQrPngBuffer };
