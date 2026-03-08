---
name: clue-game
description: "Run a full game of Clue using all Clue skills. Orchestrates clue-moderator, clue-player, clue-assistant. Use when user wants to run Clue, play full game, start with all agents."
---

# Clue Game — Run Full Game

You run an entire game of Clue by coordinating three skills: **clue-moderator**, **clue-player**, and **clue-assistant**. The user can play via the web app or a conversational session.

## Two Ways to Run

### 1. Web App (Recommended)

Run the Clue Skillaton app. It uses the skills internally.

1. **Start the app**:
   ```bash
   cd <project-root>  # or clue-skillaton/
   npm run dev
   ```
2. Open http://localhost:5173
3. **Lobby** — Choose mode:
   - **You vs Agents**: Human plays with AI opponents. Use the AI Assistant panel for strategy help (clue-assistant).
   - **All Agents**: AI agents play each other. Each agent turn uses clue-player.
4. **Setup** — Set player count (3–6), then Start Game
5. **Playing** — Human: use Suggest/Accuse dropdowns. Agent turns: click "Agent takes turn". The app uses clue-player for agent decisions and clue-assistant for human help.

The app handles moderation via its engine; clue-moderator is for conversational/text sessions.

### 2. Conversational Game

Run a text-based game without the app. Use the skills in order:

1. **You act as moderator** (clue-moderator): Create game state, track envelope, hands, turns. Announce turns and results.
2. **When an agent's turn**: Use clue-player to decide that agent's suggestion or accusation.
3. **When a human asks for help**: Use clue-assistant to advise (never play for them).

Workflow:
- Initialize: 3–6 players, deal cards, secret envelope
- Loop: whose turn → if agent, get SUGGESTION or ACCUSATION from clue-player; if human, prompt them; process disproval (next player clockwise shows one card, never suggester); advance turn
- Win: correct accusation ends the game

## Skills You Coordinate

| Skill | Role |
|-------|------|
| **clue-moderator** | Game orchestration, turn flow, disproval order, state tracking |
| **clue-player** | Agent decisions: deduction sheet, SUGGESTION/ACCUSATION output |
| **clue-assistant** | Human player advice: strategy, note-taking, "what should I suggest?" |

Install all four (this skill + the three above) for full coverage:
```bash
npx sundial-hub add clue-game --agent cursor
npx sundial-hub add clue-moderator --agent cursor
npx sundial-hub add clue-player --agent cursor
npx sundial-hub add clue-assistant --agent cursor
```

## Quick Start

- **User**: "Run a Clue game" → Start the app, or run a conversational game.
- **User**: "Play Clue with 4 AI agents" → All-agents mode; agents use clue-player.
- **User**: "I'm playing Clue, help me" → Use clue-assistant for advice.
