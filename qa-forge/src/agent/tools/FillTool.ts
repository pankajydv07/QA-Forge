/**
 * FillTool.ts (T064)
 * Single responsibility: Form fill action tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class FillTool {
  public static async execute(page: Page, selector: string, value: string, state: AgentState): Promise<AgentState> {
    await page.fill(selector, value);
    state.domSnapshot = (await page.content()).slice(0, 15000);
    return state;
  }
}
