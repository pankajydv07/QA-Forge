/**
 * SelfHealer.ts (T038, T039)
 * Single responsibility: AI-powered locator self-healing mechanism.
 */
import { Page, Locator } from '@playwright/test';
import { GroqClient } from './GroqClient';
import { MetricsStore } from '../db/MetricsStore';
import { config } from '../core/Config';
import { HealResponse, RankedSelector, HealingFailedError } from './types';
import uuid from 'node-stdlib-uuid-fallback';

export class SelfHealer {
  public static async locate(page: Page, originalSelector: string, description: string, testFile = 'unknown', testName = 'unknown'): Promise<Locator> {
    const locator = page.locator(originalSelector);

    try {
      // Try resolving selector with 2s timeout
      await locator.waitFor({ timeout: 2000, state: 'attached' });
      return locator;
    } catch (err) {
      if (!config.healingEnabled) {
        throw err;
      }

      console.warn(`[SelfHealer] Selector broken: "${originalSelector}". Initiating self-healing...`);
      MetricsStore.getInstance().upsertSelectorStat(originalSelector, 'break');

      const startTime = Date.now();
      const domSnapshot = (await page.content()).slice(0, 15000); // Truncate DOM snapshot
      const screenshotBuffer = await page.screenshot();
      const base64Screenshot = screenshotBuffer.toString('base64');

      const systemPrompt = `You are an AI Playwright locator healer. Given a broken selector, an element description, a DOM snapshot, and a screenshot, suggest 3 to 6 replacement Playwright selectors. Respond STRICTLY with JSON matching:
{
  "candidates": [
    { "selector": "string", "confidence": 0.0-1.0, "rationale": "string", "selectorType": "css|xpath|text|role|testid" }
  ],
  "elementFound": boolean,
  "suggestedDescription": "string"
}`;

      const prompt = `Broken Selector: ${originalSelector}\nElement Description: ${description}\nDOM Snapshot:\n${domSnapshot}`;

      try {
        const rawJson = await GroqClient.getInstance().complete(prompt, systemPrompt);
        const response: HealResponse = JSON.parse(rawJson);

        // Filter by confidence threshold (0.7)
        const candidates = (response.candidates || [])
          .filter((c) => c.confidence >= config.healingThreshold)
          .sort((a, b) => b.confidence - a.confidence);

        for (const candidate of candidates) {
          try {
            const healedLocator = page.locator(candidate.selector);
            await healedLocator.waitFor({ timeout: 2000, state: 'attached' });

            const healDurationMs = Date.now() - startTime;
            console.log(`[SelfHealer] Successfully healed "${originalSelector}" -> "${candidate.selector}" (confidence: ${candidate.confidence})`);

            // Persist heal event
            MetricsStore.getInstance().insertHealEvent({
              id: `heal-${Date.now()}`,
              timestamp: new Date().toISOString(),
              testFile,
              testName,
              originalSelector,
              healedSelector: candidate.selector,
              confidence: candidate.confidence,
              pageUrl: page.url(),
              healDurationMs,
            });

            MetricsStore.getInstance().upsertSelectorStat(originalSelector, 'heal');
            return healedLocator;
          } catch {
            // Candidate failed, try next
          }
        }
      } catch (aiErr: any) {
        console.error(`[SelfHealer] AI query failed: ${aiErr.message}`);
      }

      throw new HealingFailedError(`Self-healing exhausted all candidates for selector: "${originalSelector}"`);
    }
  }
}
