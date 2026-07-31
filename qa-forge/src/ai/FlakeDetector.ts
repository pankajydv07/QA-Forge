/**
 * FlakeDetector.ts (T054)
 * Single responsibility: Test flakiness detection & pattern analysis.
 */
import fs from 'fs';
import path from 'path';
import { MetricsStore, FlakeAnalysisRecord } from '../db/MetricsStore';
import { GroqClient } from './GroqClient';
import { config } from '../core/Config';

export class FlakeDetector {
  public static async analyzeFlakes(): Promise<FlakeAnalysisRecord[]> {
    const store = MetricsStore.getInstance();
    const runs = store.getTestRuns();

    // Group runs by testName
    const grouped: Record<string, typeof runs> = {};
    for (const run of runs) {
      if (!grouped[run.testName]) grouped[run.testName] = [];
      grouped[run.testName].push(run);
    }

    const flakeReport: FlakeAnalysisRecord[] = [];

    for (const [testName, testRuns] of Object.entries(grouped)) {
      if (testRuns.length < config.flakeMinRuns) continue;

      const failCount = testRuns.filter((r) => r.status === 'failed').length;
      const flakeScore = failCount / testRuns.length;

      let pattern: string | null = null;
      if (flakeScore > config.flakeThreshold) {
        try {
          const prompt = `Test "${testName}" failed ${failCount} out of ${testRuns.length} runs. Identify failure pattern in 1 sentence.`;
          pattern = await GroqClient.getInstance().complete(prompt);
        } catch {
          pattern = 'High failure rate detected across runs';
        }
      }

      const record: FlakeAnalysisRecord = {
        testName,
        flakeScore,
        totalRuns: testRuns.length,
        failCount,
        pattern,
        lastAnalysed: new Date().toISOString(),
      };

      store.upsertFlakeAnalysis(record);
      if (flakeScore > config.flakeThreshold) {
        flakeReport.push(record);
      }
    }

    const reportPath = path.resolve(process.cwd(), 'flake-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(flakeReport, null, 2));

    return flakeReport;
  }
}

if (require.main === module) {
  FlakeDetector.analyzeFlakes()
    .then((r) => console.log(`Flake detection complete. Flagged ${r.length} flaky test(s).`))
    .catch(console.error);
}
