import { request } from './api';

export const checkinApi = {
  scan: (qrToken) => request('/admin/checkin/scan', { method: 'POST', body: { qrToken } }),
  stats: (eventId) => request(`/admin/checkin/stats?event=${encodeURIComponent(eventId)}`),
};
