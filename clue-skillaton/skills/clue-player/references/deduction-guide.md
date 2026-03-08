# Clue Deduction Guide

Same rules for human and agent players.

## Note Sheet Layout

Split into sections: **Characters**, **Weapons**, **Rooms**.

```
         | You | P1  | P2  | P3
---------|-----|-----|-----|----
Scarlet  | ✗   | ✓   | ✗   | ✗
Mustard  | ✓   | ✗   | ✗   | ✗
...
Dagger   | ✗   | ✗   | 1   | ✗
...
Hall     | ✗   | ✗   | ✗   | ✗
```

## Marking Conventions

- **Your column**: ✓ have, ✗ don't have.
- **Others**: Blank by default. Only mark when you have evidence.
- **✓** = Certain—they showed you this card. Then cross ✗ the rest of that row.
- **✗** = When you tick ✓ on someone for a card, all other players in that row get ✗.
- **1, 2, 3** = Guess only. Remove number when you tick or cross. If a player column has only one number, tick it and cross others.

## Inference Rules

1. **Pass → cross all 3**: If the next person (or next people) does not have any of the 3 cards, cross all 3 under them. Repeat for each person who passes.
2. **Disprove → tick one only**: If they have a card, tick ✓ the one they showed. Do nothing to the other 2.
3. **Tick → cross row**: When you mark ✓ under a player for a card, mark ✗ for all other players in that row.
4. **All cross in row** = card is in the envelope.

## When to Accuse

- You've ruled out enough that only one combination remains
- Cross-check: each of character, weapon, room must be "envelope or suggester" with no other possibilities
