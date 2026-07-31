/**
 * globalTeardown.ts (T051, T056)
 * Single responsibility: Playwright global teardown for metrics collection & failure analysis.
 */
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { MetricsStore } from '../src/db/MetricsStore';
import { PRCommentPoster } from '../src/reporters/PRCommentPoster';

async function globalTeardown(config: FullConfig) {
  console.log('[GlobalTeardown] Starting metrics processing and failure analysis...');

  const resultsPath = path.resolve(process.cwd(), 'test-results/results.json');
  if (!fs.existsSync(resultsPath)) {
    console.log('[GlobalTeardown] No results.json found.');
    return;
  }

  const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const runId = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const metricsStore = MetricsStore.getInstance();

  for (const suite of resultsData.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          metricsStore.insertTestRun({
            id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            runId,
            testName: spec.title,
            testFile: suite.file || 'unknown',
            status: result.status,
            durationMs: result.duration,
            browser: test.projectName || 'chromium',
            workerIndex: result.workerIndex || 0,
            retryNumber: result.retry || 0,
            timestamp: new Date().toISOString(),
            errorMessage: result.error?.message,
          });
        }
      }
    }
  }

  // Trigger PR comment posting if configured
  await PRCommentPoster.postComment();
}

export default globalTeardown;
