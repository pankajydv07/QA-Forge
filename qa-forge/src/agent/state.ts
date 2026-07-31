/**
 * state.ts (T061)
 * Single responsibility: State definition for LangGraph QA Agent.
 */
import { PlannedStep, AssertionResult } from '../ai/types';

export interface AgentReport {
  task: string;
  result: 'pass' | 'fail' | 'inconclusive';
  duration: number;
  stepsExecuted: number;
  stepsPassed: number;
  stepsFailed: number;
  assertions: AssertionResult[];
  screenshots: string[];
  aiTokensUsed: number;
  recommendations: string[];
}

export interface AgentState {
  task: string;
  baseUrl: string;
  currentUrl: string;
  pageTitle: string;
  domSnapshot: string;
  screenshotBase64: string;
  consoleErrors: string[];
  plannedSteps: PlannedStep[];
  executedSteps: PlannedStep[];
  currentStepIndex: number;
  assertions: AssertionResult[];
  phase: 'planning' | 'executing' | 'asserting' | 'recovering' | 'reporting';
  errorCount: number;
  maxErrors: number;
  testResult: 'pass' | 'fail' | 'inconclusive' | null;
  report: AgentReport | null;
  messages: string[];
}
