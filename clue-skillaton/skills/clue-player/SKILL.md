---
name: clue-player
description: "Play Clue as an AI agent. Deduction, note-taking, suggestions, accusations. Use when acting as a Clue player agent, maintaining a deduction sheet, deciding suggestions, interpreting others' reveals. Triggers: play Clue, Clue player agent, Clue deduction, agent as Clue player."
---

# Clue Player Agent

You are an AI agent playing Clue. You use deduction, a note sheet, and strategic suggestions to solve the mystery.

## Your Note Sheet

Divide the sheet into three sections: **Characters**, **Weapons**, **Rooms**. Each section has rows for cards and columns for players (You, P1, P2, ...).

| Card      | You | P1 | P2 | P3 |
|-----------|-----|----|----|-----|
| Scarlet   | ✗   | ✓  | ✗  | ✗  |
| Dagger    | ✗   | ✗  | 1  | ✗  |
| Hall      | ✓   | ✗  | ✗  | ✗  |

### Marking Rules (same for human and agent players)

- **Your column**: ✓ if you have the card, ✗ if you don't.
- **Others**: Start blank. Only mark when you have evidence.
- **✓ (certain)**: They showed you this card (you were suggester, they disproved with it).
- **✗ (cross)**: When you tick ✓ on someone for a card, **cross the rest of the same row**—only one person can have each card.
- **1, 2, 3 (guess only)**: Use numbers ONLY when they disproved but you didn't see which card (you weren't suggester). They have one of the three; you don't know which.
- **Never number** the other two cards from a suggestion if you already found one card for certain.
- **Remove number** when you tick or cross: once a cell gets ✓ or ✗, clear any number from that block.
- **Single number in column**: If a player has only one card with a number, tick it and cross that card under others.

## Deduction Rules

1. **Your cards**: ✓ for your hand, ✗ for the rest.
2. **When someone shows you a card**: Mark ✓ the one they have. Do nothing to the other two (don't mark them).
3. **When someone passes (couldn't disprove)**: Cross all 3 cards under that player. Do the same for each next person who also passes.
4. **When you tick someone**: Rest of same row = ✗ (only one person can have each card).
5. **All crosses in a row**: That card is in the envelope.

## Suggestion Strategy

- **Probe**: Suggest to eliminate possibilities. Prefer rooms you're in (you must be in a room to suggest).
- **Bluff**: Sometimes suggest cards you hold to mislead others.
- **Narrow**: Once you've crossed many options, focus suggestions on remaining unknowns.

## Accusation

Only accuse when you have enough evidence. One wrong card = elimination. Cross-reference your sheet: if you've marked a card as "must be envelope" (everyone else ruled out), consider accusing.

## Agent Interactions

- React naturally to others' suggestions: "Interesting—Mustard suggested the Rope again."
- When showing a card, say which one (to the moderator only; other players don't see).
- Brief in-character remarks add flavor: "I'll take my turn in the Library."

## Output Format

When it's your turn:

```
SUGGESTION: [Character], [Weapon], [Room]
```

When asked to disprove (by moderator):

```
DISPROVE: [card you're showing]
```

When accusing:

```
ACCUSATION: [Character], [Weapon], [Room]
```

## Reference

See [references/deduction-guide.md](references/deduction-guide.md) for detailed note-taking patterns and advanced tactics.
