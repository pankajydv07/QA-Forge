/**
 * MetricsStore.ts (T019)
 * Single responsibility: Persistence of metrics, heal events, test runs, and flake analyses.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface HealEvent {
  id: string;
  timestamp: string;
  testFile: string;
  testName: string;
  originalSelector: string;
  healedSelector: string;
  confidence: number;
  pageUrl: string;
  healDurationMs: number;
}

export interface TestRunRecord {
  id: string;
  runId: string;
  testName: string;
  testFile: string;
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  durationMs: number;
  browser: string;
  workerIndex: number;
  retryNumber: number;
  timestamp: string;
  errorMessage?: string;
}

export interface FlakeAnalysisRecord {
  testName: string;
  flakeScore: number;
  totalRuns: number;
  failCount: number;
  pattern: string | null;
  lastAnalysed: string;
}

export class MetricsStore {
  private static instance: MetricsStore;
  private healsDb: Database.Database;
  private metricsDb: Database.Database;

  private constructor() {
    const healsDir = path.resolve(process.cwd(), 'healing-log');
    const metricsDir = path.resolve(process.cwd(), 'metrics');

    if (!fs.existsSync(healsDir)) fs.mkdirSync(healsDir, { recursive: true });
    if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });

    this.healsDb = new Database(path.join(healsDir, 'heals.db'));
    this.metricsDb = new Database(path.join(metricsDir, 'metrics.db'));

    this.initSchemas();
  }

  public static getInstance(): MetricsStore {
    if (!MetricsStore.instance) {
      MetricsStore.instance = new MetricsStore();
    }
    return MetricsStore.instance;
  }

  private initSchemas(): void {
    this.healsDb.exec(`
      CREATE TABLE IF NOT EXISTS heal_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        test_file TEXT NOT NULL,
        test_name TEXT NOT NULL,
        original_selector TEXT NOT NULL,
        healed_selector TEXT NOT NULL,
        confidence REAL NOT NULL,
        page_url TEXT NOT NULL,
        heal_duration_ms INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS selector_stats (
        selector TEXT PRIMARY KEY,
        break_count INTEGER DEFAULT 0,
        heal_success_count INTEGER DEFAULT 0,
        last_broken TEXT,
        last_healed TEXT
      );
    `);

    this.metricsDb.exec(`
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

      CREATE TABLE IF NOT EXISTS flake_analysis (
        test_name TEXT PRIMARY KEY,
        flake_score REAL NOT NULL,
        total_runs INTEGER NOT NULL,
        fail_count INTEGER NOT NULL,
        pattern TEXT,
        last_analysed TEXT
      );
    `);
  }

  // ── Heal Methods (T040) ───────────────────────────────────────────────────

  public insertHealEvent(event: HealEvent): void {
    const stmt = this.healsDb.prepare(`
      INSERT INTO heal_events (id, timestamp, test_file, test_name, original_selector, healed_selector, confidence, page_url, heal_duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.timestamp,
      event.testFile,
      event.testName,
      event.originalSelector,
      event.healedSelector,
      event.confidence,
      event.pageUrl,
      event.healDurationMs
    );
  }

  public upsertSelectorStat(selector: string, outcome: 'break' | 'heal'): void {
    const now = new Date().toISOString();
    if (outcome === 'break') {
      const stmt = this.healsDb.prepare(`
        INSERT INTO selector_stats (selector, break_count, last_broken)
        VALUES (?, 1, ?)
        ON CONFLICT(selector) DO UPDATE SET
          break_count = break_count + 1,
          last_broken = ?
      `);
      stmt.run(selector, now, now);
    } else {
      const stmt = this.healsDb.prepare(`
        INSERT INTO selector_stats (selector, heal_success_count, last_healed)
        VALUES (?, 1, ?)
        ON CONFLICT(selector) DO UPDATE SET
          heal_success_count = heal_success_count + 1,
          last_healed = ?
      `);
      stmt.run(selector, now, now);
    }
  }

  // ── Test Runs & Flake Methods (T055) ──────────────────────────────────────

  public insertTestRun(run: TestRunRecord): void {
    const stmt = this.metricsDb.prepare(`
      INSERT INTO test_runs (id, run_id, test_name, test_file, status, duration_ms, browser, worker_index, retry_number, timestamp, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.runId,
      run.testName,
      run.testFile,
      run.status,
      run.durationMs,
      run.browser,
      run.workerIndex,
      run.retryNumber,
      run.timestamp,
      run.errorMessage || null
    );
  }

  public getTestRuns(testName?: string): TestRunRecord[] {
    if (testName) {
      const stmt = this.metricsDb.prepare('SELECT * FROM test_runs WHERE test_name = ?');
      return stmt.all(testName) as any[];
    }
    const stmt = this.metricsDb.prepare('SELECT * FROM test_runs');
    return stmt.all() as any[];
  }

  public upsertFlakeAnalysis(analysis: FlakeAnalysisRecord): void {
    const stmt = this.metricsDb.prepare(`
      INSERT INTO flake_analysis (test_name, flake_score, total_runs, fail_count, pattern, last_analysed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(test_name) DO UPDATE SET
        flake_score = excluded.flake_score,
        total_runs = excluded.total_runs,
        fail_count = excluded.fail_count,
        pattern = excluded.pattern,
        last_analysed = excluded.last_analysed
    `);
    stmt.run(
      analysis.testName,
      analysis.flakeScore,
      analysis.totalRuns,
      analysis.failCount,
      analysis.pattern,
      analysis.lastAnalysed
    );
  }
}
