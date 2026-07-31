const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const metricsDir = path.resolve(process.cwd(), 'metrics');
if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });

const db = new Database(path.join(metricsDir, 'metrics.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    test_file TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    browser TEXT,
    worker_index INTEGER,
    retry_number INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    error_message TEXT
  );
`);

const testName = 'should login with valid credentials';
const totalRuns = 10;
const failCount = 3;

const stmt = db.prepare(`
  INSERT INTO test_runs (id, run_id, test_name, test_file, status, duration_ms, browser, worker_index, retry_number, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < totalRuns; i++) {
  const status = i < failCount ? 'failed' : 'passed';
  stmt.run(
    `seed-${i}`,
    'seed-run-id',
    testName,
    'tests/e2e/auth.spec.ts',
    status,
    500,
    'chromium',
    0,
    0,
    new Date().toISOString()
  );
}

console.log(`Successfully seeded ${totalRuns} runs (${failCount} failures) for "${testName}".`);
