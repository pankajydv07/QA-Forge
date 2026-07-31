/**
 * WaitTool.ts (T062b)
 * Single responsibility: Wait action tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class WaitTool {
  public static async execute(page: Page, timeoutMs: number, state: AgentState): Promise<AgentState> {
    await page.waitForTimeout(timeoutMs);
    state.domSnapshot = (await page.content()).slice(0, 15000);
    return state;
  }
}
