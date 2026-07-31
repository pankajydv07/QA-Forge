/**
 * products.pact.ts (T070)
 * Single responsibility: Pact consumer contract test for GET /products.
 */
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';

const provider = new PactV3({
  consumer: 'qa-forge-runner',
  provider: 'shopnode-api',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Pact Consumer: GET /products', () => {
  it('receives product list matching schema', async () => {
    provider
      .given('products exist in the catalogue')
      .uponReceiving('a request for the product list')
      .withRequest({
        method: 'GET',
        path: '/products',
        headers: { Authorization: MatchersV3.like('Bearer token123') },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: MatchersV3.eachLike({
          id: MatchersV3.string('p-001'),
          name: MatchersV3.string('Wireless Headphones'),
          price: MatchersV3.number(79.99),
          stock: MatchersV3.integer(50),
          category: MatchersV3.regex(/^(electronics|clothing|food)$/, 'electronics'),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/products`, {
        headers: { Authorization: 'Bearer token123' },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
