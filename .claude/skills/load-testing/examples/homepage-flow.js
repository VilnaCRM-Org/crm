/* global __ENV */

import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function homepageFlow() {
  const response = http.get(baseUrl);

  check(response, {
    'homepage returns 200': (result) => result.status === 200,
    'homepage has html': (result) => result.headers['Content-Type']?.includes('text/html'),
  });
}
