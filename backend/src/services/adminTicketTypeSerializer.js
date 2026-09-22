'use strict';

/** Admin view exposes everything, including raw inventory counts the public API hides. */
function serializeTicketTypeForAdmin(ticket) {
  return ticket.toObject({ virtuals: true });
}

module.exports = { serializeTicketTypeForAdmin };
