import { describe, it, expect } from 'vitest';
import { HealingFailedError } from '../types';

describe('SelfHealer Meta Test', () => {
  it('should instantiate HealingFailedError correctly', () => {
    const err = new HealingFailedError('Healing failed');
    expect(err.name).toBe('HealingFailedError');
    expect(err.message).toBe('Healing failed');
  });
});
