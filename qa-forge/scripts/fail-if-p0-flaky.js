const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'flake-report.json');

if (!fs.existsSync(reportPath)) {
  console.log('[fail-if-p0-flaky] No flake-report.json found. Check passed.');
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
const p0Flaky = report.filter((r) => r.testName.toLowerCase().includes('p0') || r.flakeScore > 0.2);

if (p0Flaky.length > 0) {
  console.error(`[fail-if-p0-flaky] ❌ PR MERGE BLOCKED: Found ${p0Flaky.length} flaky P0 test(s):`);
  p0Flaky.forEach((f) => console.error(` - ${f.testName}: flake score ${f.flakeScore} (${f.pattern})`));
  process.exit(1);
}

console.log('[fail-if-p0-flaky] ✅ All P0 tests meet flakiness threshold.');
process.exit(0);
