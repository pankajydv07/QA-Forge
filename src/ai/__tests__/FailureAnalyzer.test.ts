import { describe, it, expect } from 'vitest';
import { FailureAnalysisResult } from '../types';

describe('FailureAnalyzer Meta Test', () => {
  it('should validate FailureAnalysisResult schema format', () => {
    const result: FailureAnalysisResult = {
      rootCause: 'Selector timeout',
      category: 'selector',
      confidence: 0.9,
      suggestedFix: { description: 'Update testid', codeDiff: '' },
      isFlaky: false,
      preventionAdvice: 'Use stable data-testid',
    };
    expect(result.category).toBe('selector');
    expect(result.confidence).toBe(0.9);
  });
});
