import { describe, it, expect } from 'vitest';
import { AgentState } from '../state';

describe('QAAgent Meta Test', () => {
  it('should initialize AgentState structure correctly', () => {
    const state: AgentState = {
      task: 'test checkout',
      baseUrl: 'http://localhost:3000',
      currentUrl: 'http://localhost:3000',
      pageTitle: 'Home',
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
    expect(state.phase).toBe('planning');
    expect(state.maxErrors).toBe(3);
  });
});
