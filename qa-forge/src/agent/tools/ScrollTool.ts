/**
 * ScrollTool.ts (T062c)
 * Single responsibility: Scroll action tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class ScrollTool {
  public static async execute(page: Page, selector: string, state: AgentState): Promise<AgentState> {
    await page.locator(selector).scrollIntoViewIfNeeded();
    state.domSnapshot = (await page.content()).slice(0, 15000);
    return state;
  }
}
