/* global __ENV */

import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function signupFlow() {
  const page = http.get(`${baseUrl}/sign-up`);

  check(page, {
    'signup page loads': (result) => result.status === 200,
  });

  sleep(1);
}
