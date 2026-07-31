/**
 * verifier.ts (T071)
 * Single responsibility: Pact provider verifier running against live FastAPI backend.
 */
import { Verifier } from '@pact-foundation/pact';
import path from 'path';

async function verifyPacts() {
  const opts = {
    provider: 'shopnode-api',
    providerBaseUrl: process.env.SHOPNODE_API_URL || 'http://localhost:8000',
    pactUrls: [path.resolve(process.cwd(), 'pacts/qa-forge-runner-shopnode-api.json')],
  };

  console.log('[Pact Verifier] Verifying Pact contracts against shopnode-api...');
  await new Verifier(opts).verifyProvider();
  console.log('[Pact Verifier] Verification succeeded!');
}

if (require.main === module) {
  verifyPacts().catch((err) => {
    console.error('[Pact Verifier] Contract verification failed:', err);
    process.exit(1);
  });
}
