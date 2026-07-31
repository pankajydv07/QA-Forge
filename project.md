# QA Forge — Technical Specification

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      QA Forge                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Runner  │  │ AI Layer │  │  Agent   │             │
│  │Playwright│→ │  Claude  │→ │LangGraph │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       ↓              ↓             ↓                    │
│  ┌──────────────────────────────────────┐              │
│  │           Event Bus (EventEmitter)   │              │
│  └──────────────────────────────────────┘              │
│       ↓              ↓             ↓                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Reporter │  │Heal Store│  │  SQLite  │             │
│  │  Allure  │  │   JSON   │  │ Metrics  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Target app to test:** A small Next.js 14 + FastAPI app you build yourself — 3 pages, 5 API endpoints. You own both sides. No saucedemo.

---

## 2. Target Application Spec (The App Under Test)

Build this first. It's the thing QA Forge tests.

**Name:** `shopnode` — minimal e-commerce backend + frontend

### FastAPI Backend (`/shopnode-api`)

```
POST   /auth/login          → { access_token }
GET    /products            → Product[]
GET    /products/:id        → Product
POST   /cart/add            → Cart
DELETE /cart/remove/:id     → Cart
POST   /orders              → Order
GET    /orders/:id          → Order
```

### TypeScript Interfaces

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: 'electronics' | 'clothing' | 'food';
}

interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
}

interface Order {
  id: string;
  userId: string;
  cart: Cart;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}
```

### Next.js Frontend (`/shopnode-ui`)

- `/login` — email + password form
- `/products` — grid with sort + filter
- `/cart` — line items + checkout button
- `/orders/:id` — order confirmation

Deliberately introduce breaking changes via git branches:
- `feat/refactor-selectors` — rename data-testid attributes → triggers self-healing
- `feat/api-v2` — change response shape → triggers contract test failures
- `feat/slow-api` — add 800ms delay → triggers k6 threshold breach

---

## 3. Core Framework Spec

### 3.1 Directory Contract

Every file has exactly one responsibility. No exceptions.

```
qa-forge/
├── src/
│   ├── core/
│   │   ├── BaseTest.ts          ← extends test with custom fixtures
│   │   ├── BrowserManager.ts    ← singleton browser pool
│   │   └── Config.ts            ← typed env config
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── ProductsPage.ts
│   │   ├── CartPage.ts
│   │   └── OrderPage.ts
│   ├── ai/
│   │   ├── ClaudeClient.ts      ← singleton SDK wrapper
│   │   ├── TestGenerator.ts     ← Module 3
│   │   ├── SelfHealer.ts        ← Module 2
│   │   ├── FailureAnalyzer.ts   ← Module 4
│   │   └── FlakeDetector.ts     ← Module bonus
│   ├── agent/
│   │   ├── QAAgent.ts           ← LangGraph orchestrator
│   │   ├── state.ts             ← AgentState type
│   │   └── tools/
│   │       ├── NavigateTool.ts
│   │       ├── ObserveTool.ts
│   │       ├── ClickTool.ts
│   │       ├── FillTool.ts
│   │       ├── AssertTool.ts
│   │       └── ReportTool.ts
│   ├── contracts/
│   │   ├── consumer/
│   │   │   └── products.pact.ts
│   │   └── provider/
│   │       └── verifier.ts
│   ├── performance/
│   │   └── checkout.k6.ts
│   ├── db/
│   │   └── MetricsStore.ts      ← SQLite via better-sqlite3
│   └── reporters/
│       ├── AllureReporter.ts
│       └── AIAnnotator.ts       ← injects AI analysis into Allure
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── products.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── visual.spec.ts
│   ├── api/
│   │   ├── products.api.spec.ts
│   │   └── orders.api.spec.ts
│   └── generated/              ← AI writes here
├── fixtures/
│   ├── auth.setup.ts
│   ├── testFixtures.ts
│   └── testData.ts
├── healing-log/
│   └── heals.db                ← SQLite
├── .github/
│   └── workflows/
│       ├── pr.yml
│       ├── nightly.yml
│       └── contracts.yml
├── docker-compose.yml
├── playwright.config.ts
├── vitest.config.ts
└── k6/
    └── checkout.js
```

---

## 4. Module Specifications

---

### Module 2 — Self-Healing Locator

**Full algorithm:**

```
attempt locate(selector)
  → success: return Locator, log hit to MetricsStore
  → fail (timeout):
      1. page.content() → full DOM string
      2. page.screenshot() → base64 PNG
      3. build HealRequest { selector, description, dom, screenshot }
      4. POST to ClaudeClient with vision prompt
      5. Claude returns HealResponse { candidates: RankedSelector[] }
      6. for each candidate (ranked by confidence):
           try page.locator(candidate.selector).waitFor({ timeout: 2000 })
           → success: log heal event, return Locator
           → fail: try next candidate
      7. all candidates exhausted → throw HealingFailedError
```

**TypeScript types:**

```typescript
interface HealRequest {
  originalSelector: string;
  elementDescription: string;
  pageUrl: string;
  domSnapshot: string;         // full innerHTML, truncated to 8k tokens
  screenshotBase64: string;
  failureReason: string;
}

interface RankedSelector {
  selector: string;
  confidence: number;          // 0–1
  rationale: string;
  selectorType: 'css' | 'xpath' | 'text' | 'role' | 'testid';
}

interface HealResponse {
  candidates: RankedSelector[];
  elementFound: boolean;
  suggestedDescription: string; // Claude's better description for future use
}

interface HealEvent {
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
```

**Claude prompt (system):**
```
You are a Playwright test automation expert specialising in resilient locator strategies.
You will be given: a broken CSS/XPath selector, the element's intended purpose,
the page DOM, and a screenshot.

Return ONLY valid JSON matching this schema:
{
  "candidates": [
    {
      "selector": string,       // valid Playwright locator expression
      "confidence": number,     // 0.0 to 1.0
      "rationale": string,
      "selectorType": "css"|"xpath"|"text"|"role"|"testid"
    }
  ],
  "elementFound": boolean,
  "suggestedDescription": string
}

Prioritise: data-testid > ARIA role > semantic HTML > text > CSS class > XPath.
Return minimum 3, maximum 6 candidates ordered by confidence descending.
Never return the broken original selector.
```

**HealStore schema (SQLite):**
```sql
CREATE TABLE heal_events (
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

CREATE TABLE selector_stats (
  selector TEXT PRIMARY KEY,
  break_count INTEGER DEFAULT 0,
  heal_success_count INTEGER DEFAULT 0,
  last_broken TEXT,
  last_healed TEXT
);
```

---

### Module 3 — AI Test Generator

**Inputs:** URL string or local route path
**Output:** `.spec.ts` file written to `tests/generated/`

**Pipeline:**

```
CLI: npx qa-forge gen --url <url> --suite <name>

1. Launch Playwright browser (headless)
2. Navigate to URL, wait for networkidle
3. Extract:
   - page.content()               → DOM
   - page.screenshot({ fullPage }) → PNG
   - page.evaluate(() => {
       return {
         forms: document.querySelectorAll('form').length,
         buttons: [...document.querySelectorAll('button')].map(b => b.textContent),
         inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name })),
         links: [...document.querySelectorAll('a')].map(a => a.href),
         headings: [...document.querySelectorAll('h1,h2')].map(h => h.textContent)
       }
     })                           → PageMeta
4. Send to ClaudeClient (vision + text)
5. Claude returns GeneratedSuite JSON
6. CodeWriter serialises to .spec.ts
7. Run prettier on output file
8. Print: "Generated N tests → tests/generated/<name>.spec.ts"
```

**GeneratedSuite type:**

```typescript
interface GeneratedSuite {
  suiteName: string;
  pageUrl: string;
  imports: string[];
  tests: GeneratedTest[];
}

interface GeneratedTest {
  name: string;
  category: 'happy_path' | 'edge_case' | 'negative' | 'accessibility';
  priority: 'P0' | 'P1' | 'P2';
  steps: TestStep[];
  assertions: TestAssertion[];
  tags: string[];
}

interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'select' | 'hover' | 'wait';
  target: string;           // natural language: "the login button"
  selector: string;         // Playwright selector
  value?: string;
}

interface TestAssertion {
  type: 'visible' | 'text' | 'url' | 'count' | 'attribute' | 'not-visible';
  target: string;
  expected: string;
}
```

**CodeWriter:**
Takes `GeneratedSuite` and templates it into valid TypeScript:
```typescript
// auto-generated by QA Forge — do not edit manually
// generated: 2025-08-01T10:30:00Z
// source: https://shopnode.dev/login

import { test, expect } from '../fixtures/testFixtures';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Page — AI Generated', () => {
  // P0 | happy_path
  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.login('user@test.com', 'password123');
    await expect(page).toHaveURL(/products/);
  });
  // ... more tests
});
```

---

### Module 4 — Failure Analyzer

**Trigger:** Post-test-run hook in `playwright.config.ts` `globalTeardown`

**Algorithm:**

```
1. Read playwright-report/results.json
2. Filter: status === 'failed'
3. For each failure:
   a. Read test source file (fs.readFileSync)
   b. Load screenshot from test-results/
   c. Read error stack trace
   d. Build FailureContext
   e. Send to ClaudeClient
   f. Claude returns FailureAnalysis
   g. Write to failure-analysis/<test-id>.json
   h. AIAnnotator injects into Allure report
4. If CI=true AND GITHUB_TOKEN set:
   → PostPRComment with markdown summary
```

**Types:**

```typescript
interface FailureContext {
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace: string;
  testSourceCode: string;
  screenshotBase64?: string;
  retryCount: number;
  duration: number;
  browserName: string;
}

interface FailureAnalysis {
  rootCause: string;
  category: 'selector' | 'timing' | 'assertion' | 'network' | 'data' | 'environment';
  confidence: number;
  suggestedFix: {
    description: string;
    codeDiff: string;       // unified diff format
  };
  isFlaky: boolean;
  flakyReason?: string;
  preventionAdvice: string;
}
```

**PR Comment format:**
```markdown
## 🔴 QA Forge — Failure Analysis

**3 tests failed** in this PR.

---

### `checkout.spec.ts` → Place Order button not clickable

**Root cause:** Button is disabled until all form fields are filled.
Test clicks before filling required shipping fields.

**Fix:**
\`\`\`diff
- await page.click('#place-order');
+ await page.fill('[name="firstName"]', testData.user.firstName);
+ await page.fill('[name="lastName"]', testData.user.lastName);
+ await page.click('#place-order');
\`\`\`

**Flaky?** No | **Category:** timing | **Confidence:** 94%
```

---

### Module 5 — LangGraph QA Agent

**State definition:**

```typescript
interface AgentState {
  // Input
  task: string;                    // "test the checkout flow"
  baseUrl: string;

  // Browser state
  currentUrl: string;
  pageTitle: string;
  domSnapshot: string;
  screenshotBase64: string;
  consoleErrors: string[];

  // Test state
  plannedSteps: PlannedStep[];
  executedSteps: ExecutedStep[];
  currentStepIndex: number;
  assertions: AssertionResult[];

  // Control flow
  phase: 'planning' | 'executing' | 'asserting' | 'recovering' | 'reporting';
  errorCount: number;
  maxErrors: number;               // default 3, then abort

  // Output
  testResult: 'pass' | 'fail' | 'inconclusive' | null;
  report: AgentReport | null;
  messages: BaseMessage[];         // LangGraph message history
}
```

**Graph nodes:**

```
plan_task
    ↓
execute_step
    ↓           ↘
observe_result   handle_unexpected
    ↓           ↗
assert_state
    ↓
[all steps done?]
    ↓ yes
generate_report
    ↓
END
```

**Node specs:**

```typescript
// plan_task node
// Input: task string + initial screenshot
// Calls Claude: "You are a QA engineer. Given this task and page,
//   break it into ordered steps. Return JSON: PlannedStep[]"
// Output: state.plannedSteps populated

interface PlannedStep {
  index: number;
  description: string;
  action: AgentAction;
  expectedOutcome: string;
  recoveryHint: string;
}

type AgentAction =
  | { type: 'navigate'; url: string }
  | { type: 'click'; description: string }
  | { type: 'fill'; field: string; value: string }
  | { type: 'select'; field: string; option: string }
  | { type: 'wait'; condition: string }
  | { type: 'assert'; condition: string; expected: string }
  | { type: 'scroll'; direction: 'up' | 'down'; px: number };

// execute_step node
// Reads current planned step
// Dispatches to appropriate Playwright tool
// Captures DOM + screenshot after action
// Moves to observe_result

// observe_result node
// Sends screenshot + DOM to Claude vision:
//   "Did this action succeed? What changed on the page?
//    Is there anything unexpected? Return ObservationResult"

interface ObservationResult {
  actionSucceeded: boolean;
  pageChanged: boolean;
  unexpectedElements: string[];   // errors, popups, captchas
  currentPageContext: string;     // Claude's summary of what's on screen
  recommendNextStep: boolean;
}

// handle_unexpected node
// Triggered when observe_result.unexpectedElements.length > 0
// Strategies: dismiss modal, handle cookie banner, retry, skip step
// Has max 3 recovery attempts before marking step failed

// assert_state node
// For each assertion in current step:
//   → Playwright native assert if possible
//   → Claude vision assert if visual/complex
// Logs AssertionResult

interface AssertionResult {
  description: string;
  passed: boolean;
  actual: string;
  expected: string;
  method: 'playwright' | 'claude-vision';
}

// generate_report node
// Compiles full AgentReport from state
// Writes to reports/agent/<timestamp>.json
// Generates markdown summary

interface AgentReport {
  task: string;
  result: 'pass' | 'fail' | 'inconclusive';
  duration: number;
  stepsExecuted: number;
  stepsPassed: number;
  stepsFailed: number;
  assertions: AssertionResult[];
  screenshots: string[];          // paths
  aiTokensUsed: number;
  recommendations: string[];
}
```

**Tool implementations:**

```typescript
// NavigateTool — wraps page.goto()
// Waits for networkidle, captures initial snapshot

// ObserveTool — the eyes of the agent
// page.screenshot() + page.content()
// Sends to Claude vision, returns structured observation

// ClickTool — natural language click
// Claude picks the best selector for the described element
// Falls back to SelfHealer if first attempt fails

// FillTool — fills form fields by label/placeholder description
// Handles: input, textarea, select, contenteditable

// AssertTool — hybrid assertions
// Simple: page.locator().toBeVisible() etc
// Complex: "assert the total price is correctly calculated" → Claude vision
```

---

### Module Bonus — Flake Detector

**The differentiator no one has.**

**Algorithm:**
```
After each test run:
1. Read results, store in MetricsStore (SQLite)
2. Query: tests that have both 'passed' and 'failed' in last 10 runs
3. Calculate flakiness score:
   flakeScore = failCount / totalRuns
   where totalRuns ≥ 5
4. Flag tests with flakeScore > 0.2 as FLAKY
5. For flaky tests: send history to Claude
   → Claude identifies pattern: "fails on Firefox only",
     "fails when run in parallel", "fails at >50 concurrent users"
6. Write flake-report.json
7. Block PR merge if any P0 test is flaky (GitHub Actions check)
```

**SQLite schema:**
```sql
CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,           -- GitHub Actions run ID
  test_name TEXT NOT NULL,
  test_file TEXT NOT NULL,
  status TEXT NOT NULL,           -- passed|failed|flaky|skipped
  duration_ms INTEGER,
  browser TEXT,
  worker_index INTEGER,
  retry_number INTEGER DEFAULT 0,
  timestamp TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE flake_analysis (
  test_name TEXT PRIMARY KEY,
  flake_score REAL NOT NULL,
  total_runs INTEGER NOT NULL,
  fail_count INTEGER NOT NULL,
  pattern TEXT,                   -- Claude's identified pattern
  last_analysed TEXT
);
```

---

## 5. CI/CD Spec

### `pr.yml`

```yaml
name: PR Checks
on:
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  playwright-sharded:
    needs: lint-typecheck
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          BASE_URL: ${{ secrets.STAGING_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/

  merge-reports:
    needs: playwright-sharded
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { pattern: blob-report-*, merge-multiple: true }
      - run: npx playwright merge-reports --reporter=html ./blob-report
      - uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: playwright-report/ }

  ai-failure-analysis:
    needs: merge-reports
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - run: npm run analyze:failures
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.number }}

  flake-check:
    needs: merge-reports
    runs-on: ubuntu-latest
    steps:
      - run: npm run detect:flakes
      - run: |
          if [ -f flake-report.json ]; then
            node scripts/fail-if-p0-flaky.js
          fi
```

### `nightly.yml`

```yaml
on:
  schedule:
    - cron: '0 2 * * *'   # 2 AM UTC daily

jobs:
  full-suite:
    # Chrome + Firefox + Mobile
    # Visual regression baseline update
    # k6 load test
    # Allure report publish to GitHub Pages
```

---

## 6. Config & Environment

```typescript
// src/core/Config.ts
interface QAForgeConfig {
  baseUrl: string;
  anthropicApiKey: string;
  healing: {
    enabled: boolean;
    maxAttempts: number;         // default 3
    confidenceThreshold: number; // default 0.7, skip candidates below this
    logHeals: boolean;
  };
  generator: {
    outputDir: string;           // default 'tests/generated'
    testStyle: 'minimal' | 'verbose';
    includeAccessibility: boolean;
  };
  analyzer: {
    postPrComments: boolean;
    githubToken?: string;
  };
  agent: {
    maxSteps: number;            // default 20
    maxErrors: number;           // default 3
    screenshotEveryStep: boolean;
  };
  flakeDetector: {
    enabled: boolean;
    minRuns: number;             // default 5 before scoring
    flakeThreshold: number;      // default 0.2
    blockOnP0Flake: boolean;
  };
}
```

```env
# .env
BASE_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
HEALING_ENABLED=true
HEALING_MAX_ATTEMPTS=3
AGENT_MAX_STEPS=20
FLAKE_THRESHOLD=0.2
DB_PATH=./healing-log/heals.db
```

---

## 7. Testing the Tests (Meta Layer)

Unit tests for your AI utilities using Vitest:

```
src/ai/__tests__/
├── SelfHealer.test.ts    ← mock Claude, test healing logic
├── TestGenerator.test.ts ← mock Claude, test CodeWriter output
├── FlakeDetector.test.ts ← seed SQLite, test scoring algorithm
└── FailureAnalyzer.test.ts
```

Key: mock `ClaudeClient` at the module level, test the surrounding logic independently. This shows you understand test isolation — critical signal for an SDET role.

---

## 8. README Must-Haves

```
1. Architecture diagram (ASCII or Mermaid)
2. GIF of self-healing in action
3. GIF of agent running a full checkout flow
4. Badge: CI passing, coverage %, heals today
5. One-command setup: docker-compose up
6. How the AI layer works (plain English, 5 bullet points)
```

---

## 9. Build Order (strict)

```
Week 1:
  Day 1-2  → shopnode (the app under test)
  Day 3    → Core framework + POM + auth fixture
  Day 4    → E2E test suite (all 5 spec files)
  Day 5    → GitHub Actions CI + sharding

Week 2:
  Day 6-7  → Self-healing locator (Module 2) + SQLite store
  Day 8    → Failure analyzer (Module 4) + PR comments
  Day 9    → AI test generator (Module 3) + CodeWriter
  Day 10   → FlakeDetector

Week 3:
  Day 11-13 → LangGraph agent (Module 5)
  Day 14    → k6 + nightly workflow
  Day 15    → README, GIFs, cleanup
```

---

This is the full spec. Every interface, every algorithm, every CI step is defined. Nothing left to design — only to build.