import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ID: z.string().optional(),
  PRIVATE_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().default('development_secret'),
  WEBHOOK_PROXY_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.enum(['gemini', 'anthropic', 'openai']).default('gemini'),
  BOT_TRIGGER_COMMAND: z.string().default('@gitmedic'),
  AUTO_CURE_LABELS: z.string().default('gitmedic,bug,triage-needed'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
