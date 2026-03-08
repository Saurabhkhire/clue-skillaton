/**
 * Clue game engine — core logic for setup, turns, suggestions, accusations
 */

import type {
  Character,
  Weapon,
  Room,
  Suggestion,
  SecretEnvelope,
  Player,
  GameState,
  PlayerType,
} from './types.js';
import {
  CHARACTERS,
  WEAPONS,
  ROOMS,
  type SuggestionHistory,
  type AccusationHistory,
} from './types.js';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createSecretEnvelope(): SecretEnvelope {
  return {
    character: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
    weapon: WEAPONS[Math.floor(Math.random() * WEAPONS.length)],
    room: ROOMS[Math.floor(Math.random() * ROOMS.length)],
  };
}

export function createGame(
  playerNames: string[],
  playerTypes: PlayerType[],
): GameState {
  const secretEnvelope = createSecretEnvelope();
  const allCards: (Character | Weapon | Room)[] = [
    ...CHARACTERS.filter((c) => c !== secretEnvelope.character),
    ...WEAPONS.filter((w) => w !== secretEnvelope.weapon),
    ...ROOMS.filter((r) => r !== secretEnvelope.room),
  ];
  const shuffled = shuffle(allCards);

  const players: Player[] = playerNames.map((name, i) => {
    const count = playerNames.length;
    const start = Math.floor((i * shuffled.length) / count);
    const end = Math.floor(((i + 1) * shuffled.length) / count);
    const hand = shuffled.slice(start, end);
    return {
      id: crypto.randomUUID(),
      name,
      type: playerTypes[i] ?? 'agent',
      character: CHARACTERS[i],
      hand,
      position: null,
      isEliminated: false,
    };
  });

  return {
    id: crypto.randomUUID(),
    secretEnvelope,
    players,
    currentPlayerIndex: 0,
    suggestions: [],
    accusations: [],
    status: 'playing',
    playerCount: players.length,
  };
}

export function makeSuggestion(
  state: GameState,
  playerId: string,
  suggestion: Suggestion,
): { newState: GameState; disproverId: string | null; disprovenCard: (Character | Weapon | Room) | null } {
  if (state.status !== 'playing') {
    return { newState: state, disproverId: null, disprovenCard: null };
  }

  const current = state.players[state.currentPlayerIndex];
  if (current.id !== playerId || current.isEliminated) {
    return { newState: state, disproverId: null, disprovenCard: null };
  }

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  let disproverId: string | null = null;
  let disprovenCard: (Character | Weapon | Room) | null = null;

  // In Clue, only OTHER players (clockwise from suggester) can disprove; suggester never shows own card
  for (let i = 1; i < state.players.length; i++) {
    const checkIndex = (playerIndex + i) % state.players.length;
    const other = state.players[checkIndex];
    if (other.id === playerId || other.isEliminated) continue;

    const matching = other.hand.filter(
      (c) =>
        c === suggestion.character ||
        c === suggestion.weapon ||
        c === suggestion.room,
    );
    if (matching.length > 0) {
      disproverId = other.id;
      disprovenCard = matching[0];
      break;
    }
  }

  const history: SuggestionHistory = {
    playerId,
    suggestion,
    disproverId,
    disprovenCard,
  };

  return {
    newState: {
      ...state,
      suggestions: [...state.suggestions, history],
    },
    disproverId,
    disprovenCard,
  };
}

export function makeAccusation(
  state: GameState,
  playerId: string,
  accusation: Suggestion,
): { newState: GameState; correct: boolean } {
  if (state.status !== 'playing') {
    return { newState: state, correct: false };
  }

  const current = state.players[state.currentPlayerIndex];
  if (current.id !== playerId || current.isEliminated) {
    return { newState: state, correct: false };
  }

  const correct =
    accusation.character === state.secretEnvelope.character &&
    accusation.weapon === state.secretEnvelope.weapon &&
    accusation.room === state.secretEnvelope.room;

  const history: AccusationHistory = {
    playerId,
    accusation,
    correct,
  };

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId && !correct ? { ...p, isEliminated: true } : p,
  );

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      accusations: [...state.accusations, history],
      status: correct ? 'won' : 'playing',
      currentPlayerIndex: correct
        ? state.currentPlayerIndex
        : advanceToNextActivePlayer(updatedPlayers, state.currentPlayerIndex),
    },
    correct,
  };
}

function advanceToNextActivePlayer(
  players: Player[],
  currentIndex: number,
): number {
  for (let i = 1; i <= players.length; i++) {
    const next = (currentIndex + i) % players.length;
    if (!players[next].isEliminated) return next;
  }
  return currentIndex;
}

export function advanceTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const next = advanceToNextActivePlayer(state.players, state.currentPlayerIndex);

  return {
    ...state,
    currentPlayerIndex: next,
  };
}

export function setPlayerPosition(
  state: GameState,
  playerId: string,
  room: Room,
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, position: room } : p,
    ),
  };
}

export function getGameSummary(state: GameState): string {
  const current = state.players[state.currentPlayerIndex];
  return JSON.stringify(
    {
      status: state.status,
      currentPlayer: current?.name,
      playerCount: state.players.length,
      suggestionsCount: state.suggestions.length,
      accusationsCount: state.accusations.length,
    },
    null,
    2,
  );
}
