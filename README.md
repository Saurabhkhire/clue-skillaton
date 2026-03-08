# Clue Skillaton — Murder Mystery with AI Agent Skills

A Clue board game implementation with **Sundial agent skills** for the Skillathon hackathon. Play as a human vs AI agents, or watch AI agents play against each other.

**Architecture & workflow:** see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full documentation.

## Features

- **Two modes**:
  1. **You vs Agents** — Human player with AI opponents; optional AI assistant for strategy
  2. **All Agents** — AI agents play against each other with simulated turns

- **Three Sundial skills**:
  - **clue-moderator** — Orchestrates the game, manages turns, validates suggestions/accusations
  - **clue-player** — Agent as player: deduction, note-taking, suggestions
  - **clue-assistant** — Helps human players with strategy (advises only)

- **Deduction sheets** — Your sheet + all agents' sheets (agents mode) with ✓, ✗, —, 1/2/3 markings
- **AI Assistant** — Run button calls Groq API for strategy advice (add API key in panel or `VITE_GROQ_API_KEY`)

- **Game mechanics**: 6 characters, 6 weapons, 9 rooms; 3–6 players; full deduction logic

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

**AI Assistant**: Add your Groq API key in the panel (or set `VITE_GROQ_API_KEY` in `.env`). Get a key at [console.groq.com](https://console.groq.com). See `.env.example`.

## Skills (Sundial)

Skills are installed locally in `.cursor/skills/` for Cursor. For other agents or to publish:

### Install from Sundial (after publishing)

```bash
npx sundial-hub add clue-moderator --agent cursor
npx sundial-hub add clue-player --agent cursor
npx sundial-hub add clue-assistant --agent cursor
```

### Publish to Sundial

```bash
npx sundial-hub auth login
npx sundial-hub push skills/clue-moderator --version 1.0.0 --changelog "Initial release" --visibility public
npx sundial-hub push skills/clue-player --version 1.0.0 --changelog "Initial release" --visibility public
npx sundial-hub push skills/clue-assistant --version 1.0.0 --changelog "Initial release" --visibility public
```

## Using the Skills

- **Moderate a game**: "Run a Clue game with 4 agent players" — uses clue-moderator
- **Play as agent**: "I'm playing Clue as Scarlet, suggest a move" — uses clue-player
- **Get help**: "Help me with Clue strategy" — uses clue-assistant

## Project Structure

```
├── src/
│   ├── game/           # Core engine (types, engine, agent-simulator)
│   └── app/            # UI (App.ts)
├── skills/             # Skill source (for Sundial publish)
│   ├── clue-moderator/
│   ├── clue-player/
│   └── clue-assistant/
├── .cursor/skills/     # Cursor-installed skills
└── index.html
```

## Hackathon Tracks

- **Computer Science** — Agent skills for game orchestration
- **OpenClaw** (gaming) — Composable skills for deduction, moderation, and assistance
# clue-skillaton
