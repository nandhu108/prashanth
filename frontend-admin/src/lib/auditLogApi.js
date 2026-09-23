import { request } from './api';

export const auditLogApi = {
  list: (params = {}) => request(`/admin/audit-log?${new URLSearchParams(params).toString()}`),
};
