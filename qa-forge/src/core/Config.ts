/**
 * Config.ts (T015)
 * Single responsibility: QA Forge framework configuration.
 */
import dotenv from 'dotenv';
dotenv.config();

export interface QAForgeConfig {
  baseUrl: string;
  groqApiKey: string;
  groqModel: string;
  healingEnabled: boolean;
  healingThreshold: number;
  maxErrors: number;
  flakeMinRuns: number;
  flakeThreshold: number;
}

export const config: QAForgeConfig = {
  baseUrl: process.env.SHOPNODE_UI_URL || 'http://localhost:3000',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  healingEnabled: process.env.HEALING_ENABLED === 'true',
  healingThreshold: parseFloat(process.env.HEALING_THRESHOLD || '0.7'),
  maxErrors: parseInt(process.env.AGENT_MAX_ERRORS || '3', 10),
  flakeMinRuns: parseInt(process.env.FLAKE_MIN_RUNS || '5', 10),
  flakeThreshold: parseFloat(process.env.FLAKE_THRESHOLD || '0.2'),
};
