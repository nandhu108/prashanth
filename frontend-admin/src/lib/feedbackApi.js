import { request } from './api';

export const feedbackApi = {
  list: (eventId) => request(`/admin/feedback?event=${encodeURIComponent(eventId)}`),
};
