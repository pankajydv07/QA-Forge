/**
 * GroqClient.ts (T018)
 * Single responsibility: Singleton API client for Groq LLM interactions.
 */
import Groq from 'groq-sdk';
import { config } from '../core/Config';

export class GroqClient {
  private static instance: GroqClient;
  private client: Groq | null = null;

  private constructor() {
    if (config.groqApiKey) {
      this.client = new Groq({ apiKey: config.groqApiKey });
    }
  }

  public static getInstance(): GroqClient {
    if (!GroqClient.instance) {
      GroqClient.instance = new GroqClient();
    }
    return GroqClient.instance;
  }

  public async complete(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.client) {
      throw new Error('GroqClient error: GROQ_API_KEY is not configured.');
    }

    let retries = 0;
    const maxRetries = 2;
    const delays = [1000, 2000];

    while (true) {
      try {
        const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create({
          model: config.groqModel,
          messages,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Groq returned empty response');
        }
        return content;
      } catch (err: any) {
        if (retries >= maxRetries) {
          throw new Error(`GroqClient exhausted retries: ${err.message}`);
        }
        await new Promise((res) => setTimeout(res, delays[retries]));
        retries++;
      }
    }
  }
}
