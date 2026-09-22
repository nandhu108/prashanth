import { request } from './api';

export const registrationApi = {
  list: (params) => request(`/admin/registrations?${new URLSearchParams(params).toString()}`),
  get: (id) => request(`/admin/registrations/${id}`),
  update: (id, body) => request(`/admin/registrations/${id}`, { method: 'PATCH', body }),
  cancel: (id, reason) => request(`/admin/registrations/${id}/cancel`, { method: 'POST', body: { reason } }),
  resendTicket: (id) => request(`/admin/registrations/${id}/resend-ticket`, { method: 'POST' }),
};
