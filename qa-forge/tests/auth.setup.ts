import { test as setup, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(process.cwd(), 'playwright/.auth/user.json');

setup('authenticate', async () => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseUrl = process.env.SHOPNODE_API_URL || 'http://localhost:8000';
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${baseUrl}/auth/login`, {
    data: {
      email: 'user@test.com',
      password: 'password123',
    },
  });

  const body = await response.json();
  const token = body.access_token;

  const state = {
    cookies: [],
    origins: [
      {
        origin: process.env.SHOPNODE_UI_URL || 'http://localhost:3000',
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
