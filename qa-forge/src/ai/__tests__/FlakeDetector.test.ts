import { describe, it, expect } from 'vitest';
import { FlakeAnalysisRecord } from '../db/MetricsStore';

describe('FlakeDetector Meta Test', () => {
  it('should format FlakeAnalysisRecord correctly', () => {
    const record: FlakeAnalysisRecord = {
      testName: 'flaky test',
      flakeScore: 0.4,
      totalRuns: 10,
      failCount: 4,
      pattern: 'Timing issue on slower workers',
      lastAnalysed: new Date().toISOString(),
    };
    expect(record.flakeScore).toBe(0.4);
    expect(record.totalRuns).toBe(10);
  });
});
