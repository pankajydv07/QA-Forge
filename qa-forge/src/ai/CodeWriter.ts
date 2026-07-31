/**
 * CodeWriter.ts (T045)
 * Single responsibility: Serialising GeneratedSuite into Prettier-formatted TypeScript spec string.
 */
import prettier from 'prettier';
import { GeneratedSuite } from './types';

export class CodeWriter {
  public static async writeSpecCode(suite: GeneratedSuite): Promise<string> {
    let rawCode = `/**\n * Auto-generated test suite: ${suite.suiteName}\n * Source URL: ${suite.pageUrl}\n */\n`;
    rawCode += `import { test, expect } from '@playwright/test';\n\n`;

    rawCode += `test.describe('${suite.suiteName}', () => {\n`;

    for (const t of suite.tests) {
      const priorityLabel = `// ${t.priority} | ${t.category}`;
      rawCode += `  ${priorityLabel}\n`;
      rawCode += `  test('${t.name}', async ({ page }) => {\n`;
      rawCode += `    await page.goto('${suite.pageUrl}');\n`;

      for (const step of t.steps) {
        if (step.action === 'click') {
          rawCode += `    await page.click('${step.selector}');\n`;
        } else if (step.action === 'fill') {
          rawCode += `    await page.fill('${step.selector}', '${step.value || ''}');\n`;
        } else if (step.action === 'wait') {
          rawCode += `    await page.waitForTimeout(1000);\n`;
        }
      }

      for (const assertion of t.assertions) {
        if (assertion.type === 'visible') {
          rawCode += `    await expect(page.locator('${assertion.target}')).toBeVisible();\n`;
        } else if (assertion.type === 'text') {
          rawCode += `    await expect(page.locator('${assertion.target}')).toHaveText('${assertion.expected}');\n`;
        }
      }

      rawCode += `  });\n\n`;
    }

    rawCode += `});\n`;

    try {
      return await prettier.format(rawCode, { parser: 'typescript' });
    } catch {
      return rawCode;
    }
  }
}
