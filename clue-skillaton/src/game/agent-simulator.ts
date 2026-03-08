/**
 * Simple agent simulator for demo — uses basic deduction to pick suggestions/accusations
 */

import type { GameState, Suggestion, Player } from './types';
import { CHARACTERS, WEAPONS, ROOMS } from './types';

// Tracks what the agent "knows" (simplified)
interface AgentKnowledge {
  myCards: Set<string>;
  seen: Map<string, string>; // card -> playerId who showed it
  notInEnvelope: Set<string>; // cards we've seen in hands
}

function cardKey(c: string): string {
  return c;
}

const AGENT_FLAVOR = [
  (n: string, s: string) => `${n} mutters: "Let me consider the evidence..."`,
  (n: string, s: string) => `${n}: "I suspect ${s}."`,
  (n: string, s: string) => `${n} narrows their eyes: "The Library, perhaps..."`,
  (n: string, s: string) => `${n} taps their notes: "I have a theory."`,
  (n: string, s: string) => `${n}: "Interesting. I'll suggest ${s}."`,
];

export function simulateAgentTurn(
  state: GameState,
  playerId: string,
): { suggestion?: Suggestion; accusation?: Suggestion; dialogue?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated || state.status !== 'playing') {
    return {};
  }

  const knowledge = buildKnowledge(state, playerId);
  const name = player.name;

  const accusation = tryAccusation(state, player, knowledge);
  if (accusation) {
    const s = `${accusation.character}, ${accusation.weapon}, ${accusation.room}`;
    const fn = AGENT_FLAVOR[Math.floor(Math.random() * AGENT_FLAVOR.length)];
    return { accusation, dialogue: `${name} slams the table: "I accuse! ${s}!"` };
  }

  const suggestion = pickSuggestion(state, player, knowledge);
  const s = `${suggestion.character}, ${suggestion.weapon}, ${suggestion.room}`;
  const fn = AGENT_FLAVOR[Math.floor(Math.random() * AGENT_FLAVOR.length)];
  return { suggestion, dialogue: fn(name, s) };
}

function buildKnowledge(state: GameState, playerId: string): AgentKnowledge {
  const player = state.players.find((p) => p.id === playerId)!;
  const myCards = new Set(player.hand.map(cardKey));
  const seen = new Map<string, string>();
  const notInEnvelope = new Set<string>(player.hand.map(cardKey));

  for (const s of state.suggestions) {
    if (s.disproverId && s.disprovenCard) {
      seen.set(cardKey(s.disprovenCard), s.disproverId);
      notInEnvelope.add(cardKey(s.disprovenCard));
    }
  }

  return { myCards, seen, notInEnvelope };
}

function tryAccusation(
  state: GameState,
  player: Player,
  knowledge: AgentKnowledge,
): Suggestion | null {
  const possibleChars = CHARACTERS.filter((c) => !knowledge.myCards.has(c));
  const possibleWeapons = WEAPONS.filter((w) => !knowledge.myCards.has(w));
  const possibleRooms = ROOMS.filter((r) => !knowledge.myCards.has(r));

  if (possibleChars.length === 1 && possibleWeapons.length === 1 && possibleRooms.length === 1) {
    return {
      character: possibleChars[0],
      weapon: possibleWeapons[0],
      room: possibleRooms[0],
    };
  }
  return null;
}

function pickSuggestion(
  state: GameState,
  player: Player,
  knowledge: AgentKnowledge,
): Suggestion {
  const chars = CHARACTERS.filter((c) => !knowledge.myCards.has(c));
  const weapons = WEAPONS.filter((w) => !knowledge.myCards.has(w));
  const rooms = ROOMS.filter((r) => !knowledge.myCards.has(r));

  return {
    character: chars[Math.floor(Math.random() * chars.length)],
    weapon: weapons[Math.floor(Math.random() * weapons.length)],
    room: rooms[Math.floor(Math.random() * rooms.length)],
  };
}
