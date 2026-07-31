/**
 * agent.ts (T069)
 * Single responsibility: CLI entry point for LangGraph Autonomous QA Agent (`npx qa-forge agent`).
 */
import { BrowserManager } from '../core/BrowserManager';
import { QAAgent } from '../agent/QAAgent';

async function run() {
  const args = process.argv.slice(2);
  const taskIndex = args.indexOf('--task');
  const urlIndex = args.indexOf('--url');

  if (taskIndex === -1 || urlIndex === -1) {
    console.error('Usage: npx qa-forge agent --task "<description>" --url <url>');
    process.exit(1);
  }

  const task = args[taskIndex + 1];
  const url = args[urlIndex + 1];

  console.log(`[qa-forge agent] Starting autonomous QA agent for task: "${task}"...`);

  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.newPage();

  try {
    const finalState = await QAAgent.runTask(page, task, url);
    console.log(`[qa-forge agent] Execution complete with result: ${finalState.testResult}`);

    if (finalState.testResult === 'pass') {
      process.exit(0);
    } else if (finalState.testResult === 'fail') {
      process.exit(1);
    } else {
      process.exit(2);
    }
  } catch (err: any) {
    console.error(`[qa-forge agent] Fatal error: ${err.message}`);
    process.exit(1);
  } finally {
    await browserManager.close();
  }
}

run();
