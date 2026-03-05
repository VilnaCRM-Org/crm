import { rest } from 'msw';
import { setupServer } from 'msw/node';

import API_ENDPOINTS from '@/config/apiConfig';

const handlers = [
  rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        token: 'default-token-123',
      })
    )
  ),
  rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
    res(
      ctx.status(201),
      ctx.json({
        fullName: 'Test User',
        email: 'test@example.com',
      })
    )
  ),
];

const server = setupServer(...handlers);
export default server;
