/**
 * checkout.k6.ts (T071a)
 * Single responsibility: k6 load test TypeScript source definition.
 */
// @ts-ignore
import http from 'k6/http';
// @ts-ignore
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8000';

  const loginRes = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: 'user@test.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  check(loginRes, { 'login status is 200': (r: any) => r.status === 200 });

  const token = loginRes.json('access_token');
  const params = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const productsRes = http.get(`${baseUrl}/products`, params);
  check(productsRes, { 'products status is 200': (r: any) => r.status === 200 });

  sleep(1);
}
