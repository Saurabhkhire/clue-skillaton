/**
 * Agent player using clue-player skill via Groq LLM
 */

import type { GameState, Suggestion } from './types';
import { CHARACTERS, WEAPONS, ROOMS } from './types';
import { CLUE_PLAYER_SKILL } from './skill-loader';
import { callLLM } from '../app/llm-api';

export interface AgentLLMResult {
  suggestion?: Suggestion;
  accusation?: Suggestion;
  dialogue?: string;
}

export async function agentTurnWithSkill(
  state: GameState,
  playerId: string,
  apiKey: string,
): Promise<AgentLLMResult> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated || state.status !== 'playing') return {};

  const context = buildAgentContext(state, playerId);
  const userPrompt = `You are ${player.name} (${player.character}). It's your turn.

${context}

Output exactly one of:
SUGGESTION: [Character], [Weapon], [Room]
or
ACCUSATION: [Character], [Weapon], [Room]

Then optionally a short in-character remark on the next line.`;

  try {
    const result = await callLLM(
      [
        { role: 'system', content: CLUE_PLAYER_SKILL },
        { role: 'user', content: userPrompt },
      ],
      apiKey,
      150,
    );
    const text = result.content || '';
    return parseAgentResponse(text, player.name);
  } catch {
    return {};
  }
}

function buildAgentContext(state: GameState, playerId: string): string {
  const player = state.players.find((p) => p.id === playerId)!;
  const lines: string[] = [
    `Your hand: ${player.hand.join(', ')}`,
    `Other players: ${state.players.filter((p) => p.id !== playerId).map((p) => p.name).join(', ')}`,
    '',
    'Suggestion history:',
  ];
  for (const s of state.suggestions.slice(-8)) {
    const suggester = state.players.find((p) => p.id === s.playerId)?.name || '?';
    const disprover = s.disproverId ? state.players.find((p) => p.id === s.disproverId)?.name : null;
    lines.push(`- ${suggester}: ${s.suggestion.character}, ${s.suggestion.weapon}, ${s.suggestion.room} → ${disprover || 'no one'} showed`);
  }
  return lines.join('\n');
}

function parseAgentResponse(text: string, name: string): AgentLLMResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let suggestion: Suggestion | undefined;
  let accusation: Suggestion | undefined;
  let dialogue = '';

  for (const line of lines) {
    const sugMatch = line.match(/SUGGESTION:\s*(.+)/i);
    const accMatch = line.match(/ACCUSATION:\s*(.+)/i);
    if (sugMatch) {
      const parsed = parseTriple(sugMatch[1]);
      if (parsed) suggestion = parsed;
    } else if (accMatch) {
      const parsed = parseTriple(accMatch[1]);
      if (parsed) accusation = parsed;
    } else if (!suggestion && !accusation) {
      dialogue = line;
    }
  }

  if (accusation) {
    dialogue = dialogue || `${name} slams the table: "I accuse! ${accusation.character}, ${accusation.weapon}, ${accusation.room}!"`;
  } else if (suggestion) {
    dialogue = dialogue || `${name}: "I suggest ${suggestion.character}, ${suggestion.weapon}, ${suggestion.room}."`;
  }

  return { suggestion, accusation, dialogue: dialogue || undefined };
}

function parseTriple(s: string): Suggestion | null {
  const parts = s.split(/[,;]/).map((p) => p.trim());
  if (parts.length < 3) return null;
  const char = CHARACTERS.find((c) => parts.some((p) => p.includes(c) || c.includes(p)));
  const weapon = WEAPONS.find((w) => parts.some((p) => p.includes(w) || w.includes(p)));
  const room = ROOMS.find((r) => parts.some((p) => p.includes(r) || r.includes(p)));
  if (char && weapon && room) return { character: char, weapon, room };
  return null;
}
