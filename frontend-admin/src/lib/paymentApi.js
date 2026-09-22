import { request } from './api';

export const paymentApi = {
  list: (params = {}) => request(`/admin/payments?${new URLSearchParams(params).toString()}`),
};
