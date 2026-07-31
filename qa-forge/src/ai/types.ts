/**
 * QA Forge AI Types (T019a)
 * Single responsibility: Type definitions for all AI modules.
 */

export interface RankedSelector {
  selector: string;
  confidence: number;
  rationale: string;
  selectorType: 'css' | 'xpath' | 'text' | 'role' | 'testid';
}

export interface HealResponse {
  candidates: RankedSelector[];
  elementFound: boolean;
  suggestedDescription: string;
}

export class HealingFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HealingFailedError';
  }
}

export interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'select' | 'hover' | 'wait' | 'scroll';
  target: string;
  selector: string;
  value?: string;
}

export interface TestAssertion {
  type: 'visible' | 'text' | 'url' | 'count' | 'attribute' | 'not-visible';
  target: string;
  expected: string;
}

export interface GeneratedTest {
  name: string;
  category: 'happy_path' | 'edge_case' | 'negative' | 'accessibility';
  priority: 'P0' | 'P1' | 'P2';
  steps: TestStep[];
  assertions: TestAssertion[];
  tags: string[];
}

export interface GeneratedSuite {
  suiteName: string;
  pageUrl: string;
  imports: string[];
  tests: GeneratedTest[];
}

export interface FailureAnalysisResult {
  rootCause: string;
  category: 'selector' | 'timing' | 'assertion' | 'network' | 'data' | 'environment';
  confidence: number;
  suggestedFix: {
    description: string;
    codeDiff: string;
  };
  isFlaky: boolean;
  flakyReason?: string;
  preventionAdvice: string;
}

export interface PlannedStep {
  index: number;
  description: string;
  action: {
    type: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'assert' | 'scroll';
    [key: string]: any;
  };
  expectedOutcome: string;
  recoveryHint: string;
}

export interface AssertionResult {
  stepIndex: number;
  passed: boolean;
  actual: string;
  expected: string;
}
