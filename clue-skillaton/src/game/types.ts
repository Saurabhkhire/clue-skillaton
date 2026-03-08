/**
 * Clue game types — 6 weapons, 6 characters, 9 rooms
 */

export const CHARACTERS = [
  'Miss Scarlet',
  'Colonel Mustard',
  'Mrs. White',
  'Mr. Green',
  'Mrs. Peacock',
  'Professor Plum',
] as const;

export const WEAPONS = [
  'Dagger',
  'Candlestick',
  'Revolver',
  'Rope',
  'Lead Pipe',
  'Wrench',
] as const;

export const ROOMS = [
  'Hall',
  'Lounge',
  'Dining Room',
  'Kitchen',
  'Ballroom',
  'Conservatory',
  'Billiard Room',
  'Library',
  'Study',
] as const;

export type Character = (typeof CHARACTERS)[number];
export type Weapon = (typeof WEAPONS)[number];
export type Room = (typeof ROOMS)[number];

export interface Suggestion {
  character: Character;
  weapon: Weapon;
  room: Room;
}

export interface SecretEnvelope extends Suggestion {}

export type PlayerType = 'human' | 'agent';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  character: Character;
  hand: (Character | Weapon | Room)[];
  position: Room | null;
  isEliminated: boolean;
}

export interface GameState {
  id: string;
  secretEnvelope: SecretEnvelope;
  players: Player[];
  currentPlayerIndex: number;
  suggestions: SuggestionHistory[];
  accusations: AccusationHistory[];
  status: 'playing' | 'won' | 'setup';
  playerCount: number;
}

export interface SuggestionHistory {
  playerId: string;
  suggestion: Suggestion;
  disproverId: string | null;
  disprovenCard: (Character | Weapon | Room) | null;
}

export interface AccusationHistory {
  playerId: string;
  accusation: Suggestion;
  correct: boolean;
}
