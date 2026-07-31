/**
 * auth.setup.ts (T025)
 * Single responsibility: Global authentication setup caching JWT to storageState.
 */
import { test as setup, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({}) => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const apiContext = await request.newContext();
  const response = await apiContext.post('http://localhost:8000/auth/login', {
    data: {
      email: 'user@test.com',
      password: 'password123',
    },
  });

  const body = await response.json();
  const token = body.access_token;

  // Save storage state with token in localStorage
  const state = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'access_token',
            value: token,
          },
        ],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
});
