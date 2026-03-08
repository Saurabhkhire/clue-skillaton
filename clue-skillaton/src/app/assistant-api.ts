/**
 * AI Assistant — calls Groq API using clue-assistant skill
 */

import { CLUE_ASSISTANT_SKILL } from '../game/skill-loader';
import { callLLM } from './llm-api';

const ASSISTANT_SYSTEM =
  CLUE_ASSISTANT_SKILL ||
  `You are a Clue strategy assistant. Help with deduction and suggestions. Never reveal the solution. Be concise.`;

export interface AssistantResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export async function callAssistant(prompt: string, apiKey?: string): Promise<AssistantResponse> {
  return callLLM(
    [
      { role: 'system', content: ASSISTANT_SYSTEM },
      { role: 'user', content: prompt },
    ],
    apiKey,
    500,
  );
}
