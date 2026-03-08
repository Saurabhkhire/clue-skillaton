/**
 * LLM API — Groq (OpenAI-compatible)
 * Uses VITE_GROQ_API_KEY from .env
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export function getApiKey(): string {
  return (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GROQ_API_KEY) || '';
}

export async function callLLM(
  messages: LLMMessage[],
  apiKey?: string,
  maxTokens = 500,
): Promise<LLMResponse> {
  const key = apiKey?.trim() || getApiKey().trim();

  if (!key) {
    return {
      success: false,
      error: 'Set VITE_GROQ_API_KEY in .env to use AI features.',
    };
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return { success: false, error: data.error.message || JSON.stringify(data.error) };
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { success: false, error: 'No response from model' };

    return { success: true, content };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Request failed',
    };
  }
}
