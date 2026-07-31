/**
 * ObserveTool.ts (T065)
 * Single responsibility: Observation tool for capturing state in LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class ObserveTool {
  public static async execute(page: Page, state: AgentState): Promise<AgentState> {
    state.currentUrl = page.url();
    state.pageTitle = await page.title();
    state.domSnapshot = (await page.content()).slice(0, 15000);
    const buf = await page.screenshot();
    state.screenshotBase64 = buf.toString('base64');
    return state;
  }
}
