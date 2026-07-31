/**
 * TestGenerator.ts (T044)
 * Single responsibility: AI test suite generator.
 */
import { GroqClient } from './GroqClient';
import { GeneratedSuite } from './types';

export class TestGenerator {
  public static async generateSuite(pageUrl: string, suiteName: string): Promise<GeneratedSuite> {
    const systemPrompt = `You are a QA automation test generator. Generate a structured E2E Playwright test suite for a given web page. Return JSON matching:
{
  "suiteName": "string",
  "pageUrl": "string",
  "imports": ["string"],
  "tests": [
    {
      "name": "string",
      "category": "happy_path|edge_case|negative|accessibility",
      "priority": "P0|P1|P2",
      "steps": [{ "action": "navigate|click|fill|wait", "target": "string", "selector": "string", "value": "string" }],
      "assertions": [{ "type": "visible|text", "target": "string", "expected": "string" }],
      "tags": ["string"]
    }
  ]
}`;

    const prompt = `Generate test suite for URL: ${pageUrl}, Suite Name: ${suiteName}. Include at least 1 P0 happy_path test and 1 edge_case test.`;
    const rawJson = await GroqClient.getInstance().complete(prompt, systemPrompt);
    return JSON.parse(rawJson) as GeneratedSuite;
  }
}
