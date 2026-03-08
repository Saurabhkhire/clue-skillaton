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
- **1, 2, 3** = Guess only. Remove when tick/cross. Single number in column → tick it, cross others.

## Inference Rules

1. **Pass → cross all 3**: If someone passes (no card to show), cross all 3 under them. Same for each who passes.
2. **Disprove → tick one only**: Tick ✓ the card they showed. Do nothing to the other 2.
3. **Tick → cross row**: When you tick someone for a card, cross the rest of that row.
4. **All cross in row** = card is in the envelope.
