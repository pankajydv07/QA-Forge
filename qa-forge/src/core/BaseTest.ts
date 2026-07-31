/**
 * BaseTest.ts (T017)
 * Single responsibility: Core test fixture extension.
 */
import { test as baseTest } from '@playwright/test';
import { config, QAForgeConfig } from './Config';

export type TestFixtures = {
  qaConfig: QAForgeConfig;
};

export const test = baseTest.extend<TestFixtures>({
  qaConfig: async ({}, use) => {
    await use(config);
  },
});

export { expect } from '@playwright/test';
