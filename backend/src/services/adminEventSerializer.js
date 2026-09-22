'use strict';

/**
 * Admin views get the raw document shape (no data hidden, unlike the public
 * serializer) — the CMS needs to see and edit every field, including
 * inventory-adjacent counts a public visitor never should.
 */
function serializeEventForAdmin(event) {
  return event.toObject({ virtuals: true });
}

/** Compact row for the admin event list/switcher. */
function serializeEventAdminCard(event) {
  return {
    id: event._id,
    title: event.title,
    slug: event.slug,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    capacity: event.capacity,
    registeredCount: event.registeredCount,
    isFeatured: event.isFeatured,
    updatedAt: event.updatedAt,
  };
}

module.exports = { serializeEventForAdmin, serializeEventAdminCard };
