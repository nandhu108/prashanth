import { request } from './api';

export const ticketTypeApi = {
  list: (eventId) => request(`/admin/ticket-types?event=${encodeURIComponent(eventId)}`),
  create: (body) => request('/admin/ticket-types', { method: 'POST', body }),
  update: (id, body) => request(`/admin/ticket-types/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/admin/ticket-types/${id}`, { method: 'DELETE' }),
};
