# Clue Skillaton — Complete Architecture

This document describes the entire architecture, workflow, logical flow, and how skills are used throughout the system.

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            CLUE SKILLATON                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐  │
│  │   Web UI        │    │   Game Engine    │    │   Sundial Skills            │  │
│  │   (App.ts)      │◄──►│   (engine.ts)    │    │   (SKILL.md files)          │  │
│  │   - Lobby       │    │   - types.ts     │    │   - clue-moderator          │  │
│  │   - Setup       │    │   - deduction.ts │    │   - clue-player    ◄────┐   │  │
│  │   - Game Board  │    │   - engine       │    │   - clue-assistant  ◄───┤   │  │
│  └────────┬────────┘    └────────┬─────────┘    └─────────────────────────┼───┘  │
│           │                      │                                         │      │
│           │              ┌───────┴───────┐                                 │      │
│           │              │  skill-loader │                                 │      │
│           │              │  (loads SKILL │                                 │      │
│           ▼              │   .md content)│                                 │      │
│  ┌──────────────────────┴───────────────┴─────────────────────────────────┴───┐  │
│  │   AI / Agent Layer                                                         │  │
│  │   - assistant-api.ts  → uses clue-assistant skill → OpenAI API             │  │
│  │   - agent-llm.ts      → uses clue-player skill    → OpenAI API             │  │
│  │   - agent-simulator.ts → fallback (no skill, simple logic)                 │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Skill Usage — Where Each Skill Is Used

| Skill | Used By | How |
|-------|---------|-----|
| **clue-assistant** | AI Assistant (Run button) | `assistant-api.ts` loads `CLUE_ASSISTANT_SKILL` from `skill-loader`, sends as **system prompt** to OpenAI |
| **clue-player** | Agent turns (when API key set) | `agent-llm.ts` loads `CLUE_PLAYER_SKILL`, sends as **system prompt** to OpenAI; agent outputs SUGGESTION or ACCUSATION |
| **clue-moderator** | External agents only | Not used by web app; engine handles game logic. For Cursor/Claude orchestration. |

---

## 3. Complete Workflow

### 3.1 High-Level Flow

```
┌────────────┐    ┌────────────┐    ┌─────────────────────────────────────────────┐
│   Lobby    │───►│   Setup    │───►│   Playing (Human vs Agents | All Agents)    │
└────────────┘    └────────────┘    └─────────────────────────────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
            ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
            │ Human's turn  │           │ Agent's turn  │           │ AI Assistant  │
            │ Suggest/      │           │ (Run)         │           │ (Run button)  │
            │ Accuse        │           │               │           │               │
            └───────────────┘           └───────────────┘           └───────────────┘
                    │                           │                           │
                    │                           │                           │
                    ▼                           ▼                           ▼
            engine.makeSuggestion     agent-llm (skill)     assistant-api (skill)
            engine.makeAccusation     OR agent-simulator    → OpenAI → response
            engine.advanceTurn        (fallback)
```

### 3.2 Lobby Flow

1. User sees two modes: **You vs Agents** | **All Agents**
2. User picks mode → state.gameMode set → navigate to Setup

### 3.3 Setup Flow

1. Human mode: user enters name
2. User picks agent count (2–5)
3. Total players = human (1) + agents or agents only; must be 3–6
4. Submit → `createGame(names, types)` → state.game set → Playing

### 3.4 Game Creation Flow

```
createGame(playerNames, playerTypes)
    │
    ├── createSecretEnvelope() → 1 char, 1 weapon, 1 room (random)
    ├── Shuffle remaining 18 cards
    ├── Deal evenly to players
    └── Return GameState { players, currentPlayerIndex: 0, suggestions: [], ... }
```

### 3.5 Turn Flow — Human

1. UI shows Suggest/Accuse controls
2. User picks room, char, weapon from dropdowns
3. **Suggest** → `makeSuggestion(game, playerId, {char, weapon, room})`:
   - Find disprover (next player clockwise with matching card)
   - Append to suggestions
   - `advanceTurn()` → next player
4. **Accuse** → `makeAccusation(game, playerId, {...})`:
   - Compare to secret envelope
   - If correct → status = 'won'
   - If wrong → player eliminated, advance turn

### 3.6 Turn Flow — Agent (with Skill)

1. User clicks "Agent takes turn"
2. If API key present:
   - `agentTurnWithSkill(game, playerId, apiKey)`
   - Load **clue-player** skill as system prompt
   - Build context: hand, other players, suggestion history
   - Call OpenAI
   - Parse response for `SUGGESTION:` or `ACCUSATION:`
   - Return { suggestion, accusation, dialogue }
3. If no key or parse fails → fallback to `simulateAgentTurn()` (no skill)

### 3.7 Turn Flow — Agent (Fallback, No Skill)

1. `simulateAgentTurn(game, playerId)`
2. Build knowledge (myCards, seen from disprovals)
3. If only 1 char, 1 weapon, 1 room left → accuse
4. Else → random suggestion from cards not in hand
5. Add random flavor dialogue

### 3.8 AI Assistant Flow (Uses Skill)

1. User edits prompt (auto-filled from game: cards, suggestions)
2. User clicks "Run AI Assistant"
3. `callAssistant(prompt, apiKey)`:
   - Load **clue-assistant** skill from `skill-loader`
   - Use as **system prompt** for OpenAI
   - User prompt = context
   - Return response
4. Display in Response area

---

## 4. Logical Flow — Data Paths

### 4.1 Suggestion Path

```
User/Agent picks (char, weapon, room)
    → makeSuggestion(state, playerId, suggestion)
    → Find disprover (loop players clockwise)
    → Append SuggestionHistory { playerId, suggestion, disproverId, disprovenCard }
    → advanceTurn() → next non-eliminated player
    → state.game updated
    → buildDeductionSheet() for each player (markings updated)
    → render()
```

### 4.2 Accusation Path

```
User/Agent picks (char, weapon, room)
    → makeAccusation(state, playerId, accusation)
    → Compare to secretEnvelope
    → If match: status = 'won'
    → If no match: player eliminated, advanceTurn()
    → render()
```

### 4.3 Deduction Sheet Path

```
buildDeductionSheet(game, forPlayerId)
    │
    ├── Your column: ✓ if card in hand, else ✗
    ├── For each other player:
    │   ├── knownToHave? → ✓ (they showed you)
    │   ├── knownNotToHave? → ✗ (they passed—couldn't disprove; cross all 3)
    │   ├── whoHasIt? → ✗ for everyone else in row
    │   └── getGuessMark? → 1/2/3 (they disproved, you didn't see)
    └── All crosses in row → inEnvelope: true
```

---

## 5. Skill Architecture

### 5.1 Skill Loader (`skill-loader.ts`)

- Imports SKILL.md files with Vite `?raw`
- Strips YAML frontmatter (between `---`)
- Exports: `CLUE_ASSISTANT_SKILL`, `CLUE_PLAYER_SKILL`, `CLUE_MODERATOR_SKILL`

### 5.2 When Skills Are Used

| Component | Skill | API Call |
|-----------|-------|----------|
| AI Assistant | clue-assistant | Yes (OpenAI) |
| Agent turn | clue-player | Yes, if API key |
| Agent turn (fallback) | — | No |
| Game moderation | — | Engine only |

### 5.3 clue-moderator Usage

- **Not used by web app** — `engine.ts` handles all game logic
- Designed for **external agents** (Cursor, Claude) when orchestrating a live game
- Run: "Moderate a Clue game" → agent loads clue-moderator skill

---

## 6. File Map

| File | Role |
|------|------|
| `App.ts` | UI, state, event handlers, render |
| `engine.ts` | createGame, makeSuggestion, makeAccusation, advanceTurn |
| `types.ts` | CHARACTERS, WEAPONS, ROOMS, GameState, Player, Suggestion |
| `deduction.ts` | buildDeductionSheet (markings) |
| `skill-loader.ts` | Load SKILL.md content |
| `assistant-api.ts` | callAssistant (uses clue-assistant skill) |
| `agent-llm.ts` | agentTurnWithSkill (uses clue-player skill) |
| `agent-simulator.ts` | simulateAgentTurn (fallback, no skill) |
| `skills/clue-*/SKILL.md` | Sundial skill definitions |

---

## 7. Summary — Skills vs Non-Skills

| Feature | Uses Skill? | How |
|---------|-------------|-----|
| AI Assistant | ✅ clue-assistant | System prompt from SKILL.md |
| Agent turns (API key) | ✅ clue-player | System prompt from SKILL.md |
| Agent turns (no key) | ❌ | agent-simulator (hardcoded logic) |
| Game rules / moderation | ❌ | engine.ts (no moderator skill in app) |
| Deduction sheet | ❌ | deduction.ts (app logic) |
