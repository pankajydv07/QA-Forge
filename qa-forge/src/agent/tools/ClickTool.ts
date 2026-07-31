/**
 * ClickTool.ts (T063)
 * Single responsibility: Click action tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class ClickTool {
  public static async execute(page: Page, selector: string, state: AgentState): Promise<AgentState> {
    await page.click(selector);
    await page.waitForTimeout(500);

    state.currentUrl = page.url();
    state.domSnapshot = (await page.content()).slice(0, 15000);
    const buf = await page.screenshot();
    state.screenshotBase64 = buf.toString('base64');

    return state;
  }
}
