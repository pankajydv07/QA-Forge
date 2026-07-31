/**
 * AssertTool.ts (T066)
 * Single responsibility: Assertion execution tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';
import { AssertionResult } from '../../ai/types';

export class AssertTool {
  public static async execute(page: Page, type: string, selector: string, expected: string, stepIndex: number, state: AgentState): Promise<AgentState> {
    let passed = false;
    let actual = '';

    try {
      if (type === 'visible') {
        passed = await page.locator(selector).isVisible();
        actual = passed ? 'visible' : 'not visible';
      } else if (type === 'text') {
        actual = (await page.locator(selector).textContent()) || '';
        passed = actual.includes(expected);
      } else if (type === 'url') {
        actual = page.url();
        passed = actual.includes(expected);
      }
    } catch (err: any) {
      actual = `Error: ${err.message}`;
      passed = false;
    }

    const result: AssertionResult = { stepIndex, passed, actual, expected };
    state.assertions.push(result);
    return state;
  }
}
