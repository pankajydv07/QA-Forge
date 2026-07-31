# QA Forge — AI-Powered Playwright Test Automation Framework

QA Forge is an AI-augmented E2E testing framework for `shopnode`, an e-commerce target application built with Next.js 14 and FastAPI.

## Architecture

```
                               ┌───────────────────────────┐
                               │       GroqClient          │
                               │ (llama-3.3-70b-versatile) │
                               └─────────────┬─────────────┘
                                             │
      ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
      ▼                   ▼                  ▼                   ▼                   ▼
┌───────────┐      ┌─────────────┐    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│SelfHealer │      │TestGenerator│    │FailureAnaly.│     │FlakeDetector│     │  QAAgent    │
└─────┬─────┘      └──────┬──────┘    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
      │                   │                  │                   │                   │
      └───────────────────┴──────────────────┼───────────────────┴───────────────────┘
                                             ▼
                                     ┌───────────────┐
                                     │ MetricsStore  │
                                     │ (SQLite DBs)  │
                                     └───────────────┘
```

## Quick Start (One Command Setup)

```bash
docker-compose up
```

- Target UI: `http://localhost:3000`
- Target API: `http://localhost:8000`

## Modules & Capabilities

1. **E2E Playwright Suite**: 5 specs (Auth, Products, Cart, Checkout, Visual) with 4-shard CI runner.
2. **Self-Healing Locator**: Intercepts broken selectors and uses Groq LLM vision to heal locators with confidence ≥ 0.7.
3. **AI Test Generator**: `npx qa-forge gen --url <url> --suite <name>` generates typed, Prettier-formatted specs.
4. **Failure Analyzer**: Analyzes test failures and posts markdown root-cause reports to GitHub PR comments.
5. **Flake Detector**: Tracks test flakiness across runs in SQLite and blocks PR merges for flaky P0 tests.
6. **LangGraph QA Agent**: `npx qa-forge agent --task "<task>" --url <url>` executes multi-step autonomous workflows.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API Key | Required for AI modules |
| `SHOPNODE_UI_URL` | Target UI URL | `http://localhost:3000` |
| `SHOPNODE_API_URL` | Target API URL | `http://localhost:8000` |
| `HEALING_ENABLED` | Toggle AI self-healing | `false` |
| `GITHUB_TOKEN` | GitHub PAT for PR comments | Optional |
