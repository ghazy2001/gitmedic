import { config } from '../config/env.js';
import type { AIProvider } from '../types/index.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class AIProviderService {
  private defaultProvider: AIProvider;

  constructor() {
    this.defaultProvider = config.DEFAULT_AI_PROVIDER;
  }

  async generateText(messages: LLMMessage[], options: CompletionOptions = {}): Promise<string> {
    const provider = options.provider || this.defaultProvider;

    switch (provider) {
      case 'gemini':
        return this.callGemini(messages, options);
      case 'anthropic':
        return this.callAnthropic(messages, options);
      case 'openai':
        return this.callOpenAI(messages, options);
      default:
        return this.callGemini(messages, options);
    }
  }

  async generateJSON<T>(messages: LLMMessage[], options: CompletionOptions = {}): Promise<T> {
    const rawResponse = await this.generateText(messages, { ...options, jsonMode: true });
    
    // Extract JSON block if wrapped in markdown ```json ... ```
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleaned = jsonMatch ? jsonMatch[1] : rawResponse.trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new Error(`Failed to parse LLM response as JSON: ${rawResponse}\nError: ${err}`);
    }
  }

  private async callGemini(messages: LLMMessage[], options: CompletionOptions): Promise<string> {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment.');
    }

    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system');

    const contents = userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 8192,
      }
    };

    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: systemMsg }]
      };
    }

    if (options.jsonMode) {
      (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
    }

    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemma-4-26b-a4b-it'
    ];

    let lastError: Error | null = null;
    for (const model of candidateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[GitMedic LLM] Model ${model} returned ${res.status}: ${errText.slice(0, 100)}... trying fallback`);
          lastError = new Error(`Gemini API error (${res.status}): ${errText}`);
          continue;
        }

        const data = await res.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini candidate models failed');
  }

  private async callAnthropic(messages: LLMMessage[], options: CompletionOptions): Promise<string> {
    const apiKey = config.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment.');
    }

    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.2,
        system: systemMsg,
        messages: userMsgs
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text || '';
  }

  private async callOpenAI(messages: LLMMessage[], options: CompletionOptions): Promise<string> {
    const apiKey = config.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment.');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 4096,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {})
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
    };

    return data.choices?.[0]?.message?.content || '';
  }
}

export const aiProvider = new AIProviderService();
