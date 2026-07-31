/**
 * SelectTool.ts (T062a)
 * Single responsibility: Select option action tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class SelectTool {
  public static async execute(page: Page, selector: string, value: string, state: AgentState): Promise<AgentState> {
    await page.selectOption(selector, value);
    state.domSnapshot = (await page.content()).slice(0, 15000);
    return state;
  }
}
