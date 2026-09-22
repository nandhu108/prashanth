import { request } from './api';

export const reportApi = {
  overview: (eventId) => request(`/admin/reports/overview?event=${encodeURIComponent(eventId)}`),
};
