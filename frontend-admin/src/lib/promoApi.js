import { request } from './api';

export const promoApi = {
  list: (eventId) => request(`/admin/promo?event=${encodeURIComponent(eventId)}`),
  create: (body) => request('/admin/promo', { method: 'POST', body }),
  update: (id, body) => request(`/admin/promo/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/admin/promo/${id}`, { method: 'DELETE' }),
};
