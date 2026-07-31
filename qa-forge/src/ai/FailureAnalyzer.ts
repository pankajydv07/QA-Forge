/**
 * FailureAnalyzer.ts (T048)
 * Single responsibility: Root-cause failure analysis for failed test runs.
 */
import fs from 'fs';
import path from 'path';
import { GroqClient } from './GroqClient';
import { FailureAnalysisResult } from './types';

export class FailureAnalyzer {
  public static async analyzeFailure(testName: string, errorMessage: string, stackTrace: string): Promise<FailureAnalysisResult> {
    const systemPrompt = `You are an AI test failure analyzer. Analyze the failure and respond with JSON matching:
{
  "rootCause": "string",
  "category": "selector|timing|assertion|network|data|environment",
  "confidence": 0.0-1.0,
  "suggestedFix": { "description": "string", "codeDiff": "string" },
  "isFlaky": boolean,
  "flakyReason": "string",
  "preventionAdvice": "string"
}`;

    const prompt = `Test: ${testName}\nError: ${errorMessage}\nStack Trace: ${stackTrace}`;
    const rawJson = await GroqClient.getInstance().complete(prompt, systemPrompt);
    const result: FailureAnalysisResult = JSON.parse(rawJson);

    // Write output JSON
    const outputDir = path.resolve(process.cwd(), 'failure-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${testName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(result, null, 2));

    return result;
  }
}
