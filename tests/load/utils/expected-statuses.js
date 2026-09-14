import http from 'k6/http';

export const REJECTION_STATUSES = [400, 401, 404, 409, 422, 429];

export const expectingRejection = {
  responseCallback: http.expectedStatuses({ min: 200, max: 299 }, ...REJECTION_STATUSES),
};
