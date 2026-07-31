/**
 * NavigateTool.ts (T062)
 * Single responsibility: Navigation tool for LangGraph QA Agent.
 */
import { Page } from '@playwright/test';
import { AgentState } from '../state';

export class NavigateTool {
  public static async execute(page: Page, url: string, state: AgentState): Promise<AgentState> {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    state.currentUrl = page.url();
    state.pageTitle = await page.title();
    state.domSnapshot = (await page.content()).slice(0, 15000);
    const buf = await page.screenshot();
    state.screenshotBase64 = buf.toString('base64');

    return state;
  }
}
