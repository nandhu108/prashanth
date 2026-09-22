'use strict';

function serializePromoCodeForAdmin(promo) {
  return promo.toObject({ virtuals: true });
}

module.exports = { serializePromoCodeForAdmin };
