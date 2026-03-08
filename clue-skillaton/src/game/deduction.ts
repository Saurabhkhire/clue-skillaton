/**
 * Deduction sheet logic — sections: Characters, Weapons, Rooms
 * Markings:
 *   - You: ✓ (have), ✗ (don't have)
 *   - Others: blank; ✓ when certain (they showed you); ✗ when they passed (couldn't disprove)
 *   - If someone disproves: tick ✓ the card they showed; do nothing to the other 2
 *   - If all crosses in a row → card is in envelope
 */

import type { GameState } from './types';
import { CHARACTERS, WEAPONS, ROOMS } from './types';

export type CellMark = '✓' | '✗' | '1' | '2' | '3';

export interface SheetRow {
  card: string;
  cells: (CellMark | '')[];
  inEnvelope?: boolean; // true when all columns are ✗
}

export interface SheetSection {
  title: string;
  rows: SheetRow[];
}

export interface DeductionSheet {
  playerId: string;
  playerIndex: number;
  columns: string[];
  sections: SheetSection[];
}

export function buildDeductionSheet(
  game: GameState,
  forPlayerId: string,
): DeductionSheet {
  const player = game.players.find((p) => p.id === forPlayerId);
  if (!player) return emptySheet(forPlayerId, 0, []);

  const columns = game.players.map((p, i) =>
    p.id === forPlayerId ? 'You' : game.players[i].name,
  );

  const sections: SheetSection[] = [
    {
      title: 'Characters',
      rows: CHARACTERS.map((card) => rowForCard(game, card, forPlayerId, player, columns)),
    },
    {
      title: 'Weapons',
      rows: WEAPONS.map((card) => rowForCard(game, card, forPlayerId, player, columns)),
    },
    {
      title: 'Rooms',
      rows: ROOMS.map((card) => rowForCard(game, card, forPlayerId, player, columns)),
    },
  ];

  applySingleNumberInference(sections, game.players.findIndex((p) => p.id === forPlayerId));
  return { playerId: forPlayerId, playerIndex: game.players.indexOf(player), columns, sections };
}

/**
 * If a player column has exactly one card with a number, that card must be theirs.
 * Tick it, cross others, remove numbers.
 */
function applySingleNumberInference(
  sections: SheetSection[],
  youColIdx: number,
): void {
  const allRows: SheetRow[] = sections.flatMap((s) => s.rows);
  const nCols = allRows[0]?.cells.length ?? 0;

  for (let colIdx = 0; colIdx < nCols; colIdx++) {
    if (colIdx === youColIdx) continue;

    const rowsWithNumber = allRows.filter(
      (r) => r.cells[colIdx] === '1' || r.cells[colIdx] === '2' || r.cells[colIdx] === '3',
    );
    if (rowsWithNumber.length !== 1) continue;

    const row = rowsWithNumber[0];
    row.cells[colIdx] = '✓';
    for (let c = 0; c < nCols; c++) {
      if (c === colIdx || c === youColIdx) continue;
      row.cells[c] = '✗';
    }
    row.inEnvelope = row.cells.every((c) => c === '✗');
  }
}

function rowForCard(
  game: GameState,
  card: string,
  forPlayerId: string,
  player: { hand: (string | unknown)[] },
  columns: string[],
): SheetRow {
  // If we know someone has this card, everyone else in the row gets ✗
  const whoHasIt = game.players.find((p) => {
    if (p.id === forPlayerId) return player.hand.includes(card);
    return knownToHave(game, card, p.id, forPlayerId);
  });

  const cells: (CellMark | '')[] = game.players.map((_, colIdx) => {
    const isYou = game.players[colIdx].id === forPlayerId;
    const colPlayer = game.players[colIdx];

    if (isYou) {
      return player.hand.includes(card) ? '✓' : '✗';
    }

    const certain = knownToHave(game, card, colPlayer.id, forPlayerId);
    if (certain) return '✓';

    // They passed (couldn't disprove) a suggestion containing this card → ✗
    if (knownNotToHave(game, card, colPlayer.id, forPlayerId)) return '✗';

    // Someone else has it → this player doesn't
    if (whoHasIt && whoHasIt.id !== colPlayer.id) return '✗';

    const guess = getGuessMark(game, card, colPlayer.id, forPlayerId);
    return guess;
  });
  const inEnvelope = cells.every((c) => c === '✗');
  return { card, cells, inEnvelope: inEnvelope || undefined };
}

/**
 * Player was asked to disprove a suggestion containing this card and passed (couldn't).
 * Cross all 3 cards in that suggestion for each such player.
 */
function knownNotToHave(
  game: GameState,
  card: string,
  playerId: string,
  _viewerId: string,
): boolean {
  for (const s of game.suggestions) {
    const inSuggestion =
      s.suggestion.character === card ||
      s.suggestion.weapon === card ||
      s.suggestion.room === card;
    if (!inSuggestion) continue;

    const suggesterIdx = game.players.findIndex((p) => p.id === s.playerId);
    if (suggesterIdx < 0) continue;

    const n = game.players.length;
    if (s.disproverId) {
      const disproverIdx = game.players.findIndex((p) => p.id === s.disproverId);
      if (disproverIdx < 0) continue;
      // Everyone from (suggester+1) to (disprover-1) passed
      for (let i = 1; i < n; i++) {
        const idx = (suggesterIdx + i) % n;
        if (idx === disproverIdx) break;
        if (game.players[idx].id === playerId) return true;
      }
    } else {
      // No one disproved — everyone except suggester passed
      for (let i = 1; i < n; i++) {
        const idx = (suggesterIdx + i) % n;
        if (game.players[idx].id === playerId) return true;
      }
    }
  }
  return false;
}

/** Certain: you were suggester, they disproved with this exact card. */
function knownToHave(
  game: GameState,
  card: string,
  playerId: string,
  viewerId: string,
): boolean {
  for (const s of game.suggestions) {
    if (s.disproverId !== playerId || !s.disprovenCard) continue;
    if (s.disprovenCard !== card) continue;
    if (s.playerId === viewerId) return true;
  }
  return false;
}

/**
 * Guess: they disproved a suggestion containing this card, but you did NOT see which card.
 * Use number only when:
 * - You were NOT the suggester (so you didn't see the card)
 * - That player disproved
 * - This card was in the suggestion
 * AND we haven't already found this card for sure from another suggestion.
 */
function getGuessMark(
  game: GameState,
  card: string,
  playerId: string,
  viewerId: string,
): '' | '1' | '2' | '3' {
  if (knownToHave(game, card, playerId, viewerId)) return '';

  let guessCount = 0;
  for (const s of game.suggestions) {
    const inSuggestion =
      s.suggestion.character === card ||
      s.suggestion.weapon === card ||
      s.suggestion.room === card;
    if (!inSuggestion) continue;
    if (s.disproverId !== playerId) continue;
    if (s.playerId === viewerId) continue; // You were suggester — you know which card; use ✓, not guess
    guessCount++;
  }
  if (guessCount === 0) return '';
  return (Math.min(guessCount, 3) as 1 | 2 | 3).toString() as '1' | '2' | '3';
}

function emptySheet(
  playerId: string,
  playerIndex: number,
  columns: string[],
): DeductionSheet {
  return {
    playerId,
    playerIndex,
    columns,
    sections: [
      { title: 'Characters', rows: [] },
      { title: 'Weapons', rows: [] },
      { title: 'Rooms', rows: [] },
    ],
  };
}
