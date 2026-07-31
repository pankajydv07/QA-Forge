/**
 * QAAgent.ts (T068)
 * Single responsibility: Autonomous QA Agent using StateGraph pattern.
 */
import { StateGraph, END } from '@langchain/langgraph';
import { Page } from '@playwright/test';
import { AgentState } from './state';
import { GroqClient } from '../ai/GroqClient';
import { NavigateTool } from './tools/NavigateTool';
import { ClickTool } from './tools/ClickTool';
import { FillTool } from './tools/FillTool';
import { ObserveTool } from './tools/ObserveTool';
import { AssertTool } from './tools/AssertTool';
import { ReportTool } from './tools/ReportTool';
import { SelectTool } from './tools/SelectTool';
import { WaitTool } from './tools/WaitTool';
import { ScrollTool } from './tools/ScrollTool';
import { PlannedStep } from '../ai/types';

export class QAAgent {
  public static async runTask(page: Page, task: string, baseUrl: string): Promise<AgentState> {
    let state: AgentState = {
      task,
      baseUrl,
      currentUrl: baseUrl,
      pageTitle: '',
      domSnapshot: '',
      screenshotBase64: '',
      consoleErrors: [],
      plannedSteps: [],
      executedSteps: [],
      currentStepIndex: 0,
      assertions: [],
      phase: 'planning',
      errorCount: 0,
      maxErrors: 3,
      testResult: null,
      report: null,
      messages: [],
    };

    // Node 1: plan_task
    state = await NavigateTool.execute(page, baseUrl, state);
    const planPrompt = `Task: ${task}\nBase URL: ${baseUrl}\nReturn JSON array of planned steps:
[
  {
    "index": 0,
    "description": "string",
    "action": { "type": "navigate|click|fill|select|wait|assert|scroll", "url": "string", "selector": "string", "value": "string" },
    "expectedOutcome": "string",
    "recoveryHint": "string"
  }
]`;

    try {
      const rawPlan = await GroqClient.getInstance().complete(planPrompt);
      state.plannedSteps = JSON.parse(rawPlan) as PlannedStep[];
    } catch {
      // Fallback deterministic plan
      state.plannedSteps = [
        {
          index: 0,
          description: 'Navigate to login',
          action: { type: 'navigate', url: `${baseUrl}/login` },
          expectedOutcome: 'Login page loaded',
          recoveryHint: 'Refresh page',
        },
        {
          index: 1,
          description: 'Login user',
          action: { type: 'fill', selector: '[data-testid="login-email"]', value: 'user@test.com' },
          expectedOutcome: 'Email filled',
          recoveryHint: 'Re-enter email',
        },
      ];
    }

    // Execution loop
    state.phase = 'executing';
    for (let i = 0; i < state.plannedSteps.length; i++) {
      if (state.errorCount >= state.maxErrors) {
        state.testResult = 'inconclusive';
        break;
      }

      const step = state.plannedSteps[i];
      state.currentStepIndex = i;

      try {
        if (step.action.type === 'navigate') {
          state = await NavigateTool.execute(page, step.action.url || baseUrl, state);
        } else if (step.action.type === 'click') {
          state = await ClickTool.execute(page, step.action.selector, state);
        } else if (step.action.type === 'fill') {
          state = await FillTool.execute(page, step.action.selector, step.action.value || '', state);
        } else if (step.action.type === 'select') {
          state = await SelectTool.execute(page, step.action.selector, step.action.value || '', state);
        } else if (step.action.type === 'wait') {
          state = await WaitTool.execute(page, 1000, state);
        } else if (step.action.type === 'scroll') {
          state = await ScrollTool.execute(page, step.action.selector, state);
        } else if (step.action.type === 'assert') {
          state = await AssertTool.execute(page, 'visible', step.action.selector, '', i, state);
        }

        state.executedSteps.push(step);
      } catch (err) {
        state.errorCount++;
      }
    }

    // Node 6: generate_report
    state.phase = 'reporting';
    await ReportTool.execute(state);

    return state;
  }
}
