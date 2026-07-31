/**
 * gen.ts (T046)
 * Single responsibility: CLI entry point for AI Test Generator (`npx qa-forge gen`).
 */
import { TestGenerator } from '../ai/TestGenerator';
import { CodeWriter } from '../ai/CodeWriter';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function run() {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');
  const suiteIndex = args.indexOf('--suite');

  if (urlIndex === -1 || suiteIndex === -1) {
    console.error('Usage: npx qa-forge gen --url <url> --suite <name>');
    process.exit(1);
  }

  const url = args[urlIndex + 1];
  const suiteName = args[suiteIndex + 1];

  try {
    console.log(`[qa-forge gen] Analyzing URL: ${url}...`);
    const suite = await TestGenerator.generateSuite(url, suiteName);
    const code = await CodeWriter.writeSpecCode(suite);

    const outDir = path.resolve(process.cwd(), 'tests/generated');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, `${suiteName}.spec.ts`);
    fs.writeFileSync(outFile, code);
    console.log(`[qa-forge gen] Successfully generated ${suite.tests.length} tests -> ${outFile}`);

    // Verify TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'ignore' });
      process.exit(0);
    } catch {
      console.warn('[qa-forge gen] Warning: Generated test file has TypeScript compilation issues.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`[qa-forge gen] Error: ${err.message}`);
    process.exit(2);
  }
}

run();
