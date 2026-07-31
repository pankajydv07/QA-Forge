import { describe, it, expect, vi } from 'vitest';
import { GroqClient } from '../GroqClient';

describe('GroqClient Meta Test', () => {
  it('should instantiate GroqClient singleton', () => {
    const client1 = GroqClient.getInstance();
    const client2 = GroqClient.getInstance();
    expect(client1).toBe(client2);
  });
});
