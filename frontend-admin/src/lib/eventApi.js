import { request } from './api';

export const eventApi = {
  list: () => request('/admin/events'),
  create: (body) => request('/admin/events', { method: 'POST', body }),
  get: (id) => request(`/admin/events/${id}`),
  update: (id, body) => request(`/admin/events/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/admin/events/${id}`, { method: 'DELETE' }),
  replaceArray: (id, field, items) =>
    request(`/admin/events/${id}/${field}`, { method: 'PUT', body: { [field]: items } }),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/admin/uploads', { method: 'POST', body: form });
  },
};
