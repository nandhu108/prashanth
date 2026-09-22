import { request } from './api';

export const userApi = {
  list: () => request('/admin/users'),
  create: (body) => request('/admin/users', { method: 'POST', body }),
  update: (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
};
