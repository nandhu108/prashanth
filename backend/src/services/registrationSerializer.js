'use strict';

/** Returned to the attendee right after they register — their own data only. */
function serializeRegistrationForPublic(reg) {
  return {
    id: reg._id,
    registrationCode: reg.registrationCode,
    status: reg.status,
    attendee: reg.attendee,
    pricing: reg.pricing,
    qrToken: reg.qrToken || null,
    createdAt: reg.createdAt,
  };
}

/** Admin sees everything, plus the joined event/ticket-type summaries when populated. */
function serializeRegistrationForAdmin(reg) {
  const obj = reg.toObject({ virtuals: true });
  return {
    ...obj,
    id: obj._id,
    event: reg.event && reg.event.title ? { id: reg.event._id, title: reg.event.title, slug: reg.event.slug } : obj.event,
    ticketType: reg.ticketType && reg.ticketType.name
      ? { id: reg.ticketType._id, name: reg.ticketType.name, code: reg.ticketType.code }
      : obj.ticketType,
  };
}

module.exports = { serializeRegistrationForPublic, serializeRegistrationForAdmin };
