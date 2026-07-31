import { describe, it, expect } from 'vitest';
import { CodeWriter } from '../CodeWriter';
import { GeneratedSuite } from '../types';

describe('TestGenerator & CodeWriter Meta Test', () => {
  it('should format GeneratedSuite into Playwright test string', async () => {
    const suite: GeneratedSuite = {
      suiteName: 'LoginTest',
      pageUrl: 'http://localhost:3000/login',
      imports: [],
      tests: [
        {
          name: 'login test',
          category: 'happy_path',
          priority: 'P0',
          steps: [{ action: 'fill', target: 'email', selector: '#email', value: 'user@test.com' }],
          assertions: [{ type: 'visible', target: '#success', expected: '' }],
          tags: ['auth'],
        },
      ],
    };

    const code = await CodeWriter.writeSpecCode(suite);
    expect(code).toContain("test.describe('LoginTest'");
    expect(code).toContain("// P0 | happy_path");
  });
});
