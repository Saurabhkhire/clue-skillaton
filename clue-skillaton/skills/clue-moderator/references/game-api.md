# Clue Game Engine API

The game engine exposes these functions. Import from `src/game/engine.ts`.

## createGame(playerNames: string[], playerTypes: ('human'|'agent')[]): GameState

Creates a new game. Shuffles cards, builds secret envelope, distributes hands.

## makeSuggestion(state, playerId, suggestion): { newState, disproverId, disprovenCard }

Processes a suggestion. Returns updated state and who (if anyone) disproved with which card.

## makeAccusation(state, playerId, accusation): { newState, correct }

Processes an accusation. Returns updated state and whether it was correct.

## advanceTurn(state): GameState

Moves to the next non-eliminated player.

## setPlayerPosition(state, playerId, room): GameState

Updates a player's room (for movement phase).

## Types

- `Suggestion`: { character, weapon, room }
- `Character`, `Weapon`, `Room`: string unions from `types.ts`
- `GameState`: full game state object
