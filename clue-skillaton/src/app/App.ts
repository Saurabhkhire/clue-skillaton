import {
  createGame,
  makeSuggestion,
  makeAccusation,
  advanceTurn,
} from '../game/engine';
import { simulateAgentTurn } from '../game/agent-simulator';
import { agentTurnWithSkill } from '../game/agent-llm';
import { buildDeductionSheet } from '../game/deduction';
import { callAssistant } from './assistant-api';
import { getApiKey } from './llm-api';
import type { GameState, Suggestion, Room } from '../game/types';
import { ROOMS, CHARACTERS, WEAPONS } from '../game/types';

type AppMode = 'lobby' | 'setup' | 'playing' | 'won' | 'rules';
type GameMode = 'human-vs-agents' | 'all-agents';

interface AppState {
  mode: AppMode;
  gameMode: GameMode | null;
  playerName: string;
  agentCount: number;
  game: GameState | null;
  dialogueLog: string[];
  assistantPrompt: string;
  assistantResponse: string;
  assistantLoading: boolean;
  assistantError: string;
}

let state: AppState = {
  mode: 'lobby',
  gameMode: null,
  playerName: '',
  agentCount: 3,
  game: null,
  dialogueLog: [],
  assistantPrompt: '',
  assistantResponse: '',
  assistantLoading: false,
  assistantError: '',
};

function render() {
  const root = document.getElementById('root');
  if (!root) return;

  if (state.mode === 'lobby') {
    root.innerHTML = renderLobby();
    bindLobbyEvents();
    return;
  }

  if (state.mode === 'setup') {
    root.innerHTML = renderSetup();
    bindSetupEvents();
    return;
  }

  if (state.mode === 'playing' || state.mode === 'won') {
    root.innerHTML = renderGame();
    bindGameEvents();
    return;
  }

  if (state.mode === 'rules') {
    root.innerHTML = renderRules();
    bindRulesEvents();
  }
}

function renderLobby(): string {
  return `
    <div class="app lobby">
      <h1>Clue</h1>
      <p class="subtitle">Murder Mystery · Skillathon Hackathon</p>
      <div class="mode-grid">
        <div class="mode-card">
          <h3>You vs Agents</h3>
          <p>Play as a human with AI opponents. Use the AI Assistant panel to get strategy help from Cursor.</p>
          <button data-mode="human-vs-agents">Play</button>
        </div>
        <div class="mode-card">
          <h3>All Agents</h3>
          <p>Watch AI agents play. See each agent's deduction sheet and in-game banter.</p>
          <button data-mode="all-agents">Spectate</button>
        </div>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        Skills: clue-game · clue-moderator · clue-player · clue-assistant · Sundial
      </p>
      <a href="#" id="btn-rules" class="rules-link">How to Play</a>
    </div>
  `;
}

function renderRules(): string {
  return `
    <div class="app rules-page">
      <h1>Clue — How to Play</h1>
      <div class="rules-content">
        <section>
          <h2>Objective</h2>
          <p>Discover who committed the murder, with which weapon, and in which room. One character, one weapon, and one room are hidden in the envelope. The first player to correctly accuse wins.</p>
        </section>
        <section>
          <h2>Setup</h2>
          <p>Three cards (one character, one weapon, one room) are placed in the secret envelope. The remaining cards are dealt to the players. Each player keeps their hand private.</p>
        </section>
        <section>
          <h2>Characters, Weapons & Rooms</h2>
          <p><strong>Characters:</strong> Miss Scarlet, Colonel Mustard, Mrs. White, Mr. Green, Mrs. Peacock, Professor Plum</p>
          <p><strong>Weapons:</strong> Dagger, Candlestick, Revolver, Rope, Lead Pipe, Wrench</p>
          <p><strong>Rooms:</strong> Hall, Lounge, Dining Room, Kitchen, Ballroom, Conservatory, Billiard Room, Library, Study</p>
        </section>
        <section>
          <h2>Your Turn</h2>
          <p>On your turn you may either <strong>Suggest</strong> or <strong>Accuse</strong>.</p>
          <h3>Suggest</h3>
          <p>Name one character, one weapon, and one room. Starting with the player to your left (clockwise), each player in turn checks their hand. The first player who has <em>any</em> of those three cards must show you <strong>one</strong> of them in secret. The suggester <strong>never</strong> shows their own cards — only other players can disprove. If no one can disprove, play continues to the next turn.</p>
          <h3>Accuse</h3>
          <p>Name one character, one weapon, and one room as your final guess. Check the envelope: if you're correct, you win. If you're wrong, you're eliminated and no longer take turns. The game continues until someone wins or everyone else has been eliminated.</p>
        </section>
        <section>
          <h2>Deduction Sheet</h2>
          <p>Use the deduction sheet to track what you learn:</p>
          <ul>
            <li><strong>✓ (tick)</strong> — You have this card, or you're certain a player has it (they showed you).</li>
            <li><strong>✗ (cross)</strong> — You don't have it, or you know a player doesn't have it (they passed on a suggestion containing it).</li>
            <li><strong>1, 2, 3</strong> — A player disproved a suggestion containing this card, but you didn't see which of the three they showed (possible matches).</li>
            <li>When all players have ✗ for a card, that card is in the envelope.</li>
          </ul>
        </section>
        <section>
          <h2>Tips</h2>
          <ul>
            <li>Suggest cards you don't have to rule them out.</li>
            <li>Watch who passes — if they couldn't disprove, they don't have any of those three cards.</li>
            <li>Accuse only when you're confident; a wrong accusation eliminates you.</li>
          </ul>
        </section>
      </div>
      <button id="btn-back" class="primary">Back to Lobby</button>
    </div>
  `;
}

function renderSetup(): string {
  const totalPlayers =
    state.gameMode === 'human-vs-agents' ? state.agentCount + 1 : state.agentCount;
  return `
    <div class="app">
      <h1>Clue — Setup</h1>
      <form class="setup-form" id="setup-form">
        <h2>${state.gameMode === 'human-vs-agents' ? 'You vs Agents' : 'All Agents'}</h2>
        ${
          state.gameMode === 'human-vs-agents'
            ? `
          <label>Your name</label>
          <input type="text" id="player-name" value="${state.playerName}" placeholder="Detective" required />
        `
            : ''
        }
        <label>Number of AI agents</label>
        <select id="agent-count">
          ${[2, 3, 4, 5].map(
            (n) =>
              `<option value="${n}" ${state.agentCount === n ? 'selected' : ''}>${n}</option>`,
          )}
        </select>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">
          Total players: ${totalPlayers} (3–6 allowed)
        </p>
        <button type="submit" class="primary">Start Game</button>
      </form>
    </div>
  `;
}

function renderDeductionSheet(sheet: ReturnType<typeof buildDeductionSheet>, title: string, isYou = false): string {
  const headerCells = sheet.columns.map((c) => `<th>${c}</th>`).join('');
  const sectionHtml = sheet.sections
    .map(
      (sec) => `
      <div class="sheet-section">
        <h5>${sec.title}</h5>
        <table class="sheet-table">
          <thead><tr><th>Card</th>${headerCells}</tr></thead>
          <tbody>
            ${sec.rows
              .map(
                (r) => `
              <tr class="${r.inEnvelope ? 'row-envelope' : ''}">
                <td class="sheet-card">${r.card}${r.inEnvelope ? ' (envelope)' : ''}</td>
                ${r.cells.map((c) => `<td class="sheet-cell ${c ? 'marked' : ''}" data-mark="${c}">${c || '·'}</td>`).join('')}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `,
    )
    .join('');
  return `
    <div class="deduction-sheet ${isYou ? 'your-sheet' : ''}">
      <h4>${title}${isYou ? ' (Your notes)' : ''}</h4>
      <div class="sheet-legend">✓ have · ✗ don't have · Pass→cross 3 · Disprove→tick one · All ✗ = envelope</div>
      ${sectionHtml}
    </div>
  `;
}

function renderGame(): string {
  const game = state.game!;
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isHumanTurn =
    state.gameMode === 'human-vs-agents' && currentPlayer?.type === 'human';
  const humanPlayer = game.players.find((p) => p.type === 'human');

  const suggestionRows = game.suggestions
    .slice(-12)
    .reverse()
    .map(
      (s) => `
      <div class="suggestion-item">
        <span class="sug-player">${getPlayerName(s.playerId)}</span> suggests: 
        <strong>${s.suggestion.character}</strong>, ${s.suggestion.weapon}, ${s.suggestion.room}
        <div class="result">
          ${s.disproverId ? `→ ${getPlayerName(s.disproverId)} showed a card` : '→ No one could disprove'}
        </div>
      </div>
    `,
    )
    .join('');

  const playerRows = game.players.map(
    (p) => `
      <div class="player-row ${p.isEliminated ? 'eliminated' : ''} ${p.id === currentPlayer?.id ? 'current' : ''}">
        <span class="player-avatar">${p.name.charAt(0)}</span>
        <span>${p.name} <em>(${p.character})</em></span>
        <span class="player-type">${p.type}</span>
      </div>
    `,
  ).join('');

  const winBanner =
    game.status === 'won'
      ? `
    <div class="win-banner">
      <h2>🎉 ${getPlayerName(game.accusations[game.accusations.length - 1]?.playerId ?? '')} wins!</h2>
      <p>The solution: ${game.secretEnvelope.character}, ${game.secretEnvelope.weapon}, ${game.secretEnvelope.room}</p>
    </div>
  `
      : '';

  const roomOptions = ROOMS.map((r) => `<option value="${r}">${r}</option>`).join('');
  const charOptions = CHARACTERS.map((c) => `<option value="${c}">${c}</option>`).join('');
  const weaponOptions = WEAPONS.map((w) => `<option value="${w}">${w}</option>`).join('');

  // Deduction sheets
  const humanSheet =
    humanPlayer && state.gameMode === 'human-vs-agents'
      ? renderDeductionSheet(buildDeductionSheet(game, humanPlayer.id), state.playerName, true)
      : '';

  const agentSheets =
    state.gameMode === 'all-agents'
      ? game.players
          .map((p) =>
            renderDeductionSheet(buildDeductionSheet(game, p.id), `${p.name}'s sheet`, false),
          )
          .join('')
      : '';

  const dialogueBlock =
    state.dialogueLog.length > 0
      ? `
    <div class="dialogue-panel">
      <h3>Agent talk</h3>
      ${state.dialogueLog.slice(-5).reverse().map((d) => `<div class="dialogue-line">${d}</div>`).join('')}
    </div>
  `
      : '';

  const aiAssistantBlock =
    state.gameMode === 'human-vs-agents' && game.status === 'playing'
      ? `
    <div class="assistant-panel">
      <h3>AI Assistant</h3>
      <p class="assistant-help">Get strategy advice. Uses your cards and suggestion history. API key from .env (VITE_GROQ_API_KEY).</p>
      <label>Context (auto-filled from game):</label>
      <textarea id="assistant-prompt" rows="5" placeholder="Describe your situation...">${state.assistantPrompt || getAssistantPrompt()}</textarea>
      <button type="button" class="primary" id="btn-run-assistant" ${state.assistantLoading ? 'disabled' : ''}>${state.assistantLoading ? 'Thinking…' : 'Run AI Assistant'}</button>
      ${state.assistantError ? `<div class="assistant-error">${state.assistantError}</div>` : ''}
      <label>Response:</label>
      <div class="assistant-response" id="assistant-response-display">${escapeHtml(state.assistantResponse).replace(/\n/g, '<br>')}</div>
    </div>
  `
      : '';

  const turnBlock =
    game.status === 'playing'
      ? isHumanTurn
        ? `
        <div class="turn-actions">
          <div class="actions-bar">
            <select id="sug-room">${roomOptions}</select>
            <select id="sug-char">${charOptions}</select>
            <select id="sug-weapon">${weaponOptions}</select>
            <button class="primary" id="btn-suggest">Suggest</button>
            <button class="secondary" id="btn-accuse">Accuse</button>
          </div>
        </div>
      `
        : currentPlayer?.type === 'agent'
          ? `
        <div class="turn-actions agent-turn">
          <div class="current-player-spotlight">
            <span class="avatar">${currentPlayer.name.charAt(0)}</span>
            <span><strong>${currentPlayer.name}</strong> is thinking...</span>
          </div>
          <button class="primary" id="btn-agent-turn">${currentPlayer.name} takes turn</button>
        </div>
      `
          : ''
      : '';

  return `
    <div class="app game-app">
      ${winBanner}
      <div class="game-header-bar">
        <h2>Clue</h2>
        <span class="turn-badge">${currentPlayer?.name}'s turn</span>
      </div>

      <div class="game-layout">
        <div class="game-main">
          <div class="game-board-area">
            <div class="players-panel">
              <h3>Players</h3>
              <div class="players-grid">${playerRows}</div>
            </div>

            <div class="suggestions-panel">
              <h3>Suggestions</h3>
              ${suggestionRows || '<p class="empty">No suggestions yet.</p>'}
            </div>

            ${dialogueBlock}
            ${turnBlock}
          </div>

          <div class="sheets-section">
            <h3>Deduction sheets</h3>
            ${
              humanPlayer && state.gameMode === 'human-vs-agents'
                ? `
              <div class="your-cards-bar">
                <strong>Your cards:</strong>
                ${humanPlayer.hand.map((c) => `<span class="hand-card">${c}</span>`).join('')}
              </div>
            `
                : ''
            }
            ${humanSheet}
            ${agentSheets}
          </div>

          ${aiAssistantBlock}
        </div>
      </div>
    </div>
  `;
}

function getAssistantPrompt(): string {
  const game = state.game;
  if (!game) return '';
  const humanPlayer = game.players.find((p) => p.type === 'human');
  if (!humanPlayer) return '';
  const recent = game.suggestions.slice(-5).map((s) => {
    const p = getPlayerName(s.playerId);
    const d = s.disproverId ? getPlayerName(s.disproverId) : 'no one';
    return `${p} suggested ${s.suggestion.character}, ${s.suggestion.weapon}, ${s.suggestion.room} → ${d} showed`;
  }).join('\n');
  return `Help me with Clue strategy.

My cards: ${humanPlayer.hand.join(', ')}
Other players: ${game.players.filter(p => p.type === 'agent').map(p => p.name).join(', ')}

Recent suggestions:
${recent}

What should I suggest next? Should I accuse?`;
}

function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getPlayerName(id: string): string {
  return state.game?.players.find((p) => p.id === id)?.name ?? id;
}

function bindLobbyEvents() {
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.gameMode = (btn as HTMLElement).dataset.mode as GameMode;
      state.mode = 'setup';
      state.agentCount = state.gameMode === 'human-vs-agents' ? 3 : 4;
      render();
    });
  });
  document.getElementById('btn-rules')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.mode = 'rules';
    render();
  });
}

function bindRulesEvents() {
  document.getElementById('btn-back')?.addEventListener('click', () => {
    state.mode = 'lobby';
    render();
  });
}

function bindSetupEvents() {
  const form = document.getElementById('setup-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    const agentCountSelect = document.getElementById('agent-count') as HTMLSelectElement;
    state.playerName = playerNameInput?.value?.trim() || 'You';
    state.agentCount = parseInt(agentCountSelect?.value || '3', 10);
    const total =
      state.gameMode === 'human-vs-agents' ? state.agentCount + 1 : state.agentCount;
    if (total < 3 || total > 6) {
      alert('Total players must be 3–6.');
      return;
    }

    const names: string[] = [];
    const types: ('human' | 'agent')[] = [];

    if (state.gameMode === 'human-vs-agents') {
      names.push(state.playerName);
      types.push('human');
    }

    const agentNames = ['Scarlet', 'Mustard', 'White', 'Green', 'Peacock', 'Plum'];
    for (let i = 0; i < state.agentCount; i++) {
      names.push(agentNames[i] || `Agent ${i + 1}`);
      types.push('agent');
    }

    state.game = createGame(names, types);
    state.dialogueLog = [];
    state.assistantPrompt = '';
    state.assistantResponse = '';
    state.assistantError = '';
    state.mode = 'playing';
    render();
  });
}

function bindGameEvents() {
  const humanPlayer = state.game?.players.find((p) => p.type === 'human');

  document.getElementById('btn-suggest')?.addEventListener('click', () => {
    if (!state.game || state.game.status !== 'playing') return;
    if (!humanPlayer || state.game.players[state.game.currentPlayerIndex].id !== humanPlayer.id) return;

    const room = (document.getElementById('sug-room') as HTMLSelectElement)?.value as Room;
    const char = (document.getElementById('sug-char') as HTMLSelectElement)?.value as Suggestion['character'];
    const weapon = (document.getElementById('sug-weapon') as HTMLSelectElement)?.value as Suggestion['weapon'];

    const { newState } = makeSuggestion(state.game, humanPlayer.id, {
      character: char,
      weapon,
      room,
    });
    state.game = advanceTurn(newState);
    state.assistantPrompt = getAssistantPrompt();
    render();
  });

  document.getElementById('btn-agent-turn')?.addEventListener('click', async () => {
    if (!state.game || state.game.status !== 'playing') return;
    const currentPlayer = state.game.players[state.game.currentPlayerIndex];
    if (currentPlayer?.type !== 'agent') return;

    const apiKey = getApiKey();
    let result: { suggestion?: import('../game/types').Suggestion; accusation?: import('../game/types').Suggestion; dialogue?: string };

    if (apiKey) {
      result = await agentTurnWithSkill(state.game, currentPlayer.id, apiKey);
      if (!result.suggestion && !result.accusation) result = simulateAgentTurn(state.game, currentPlayer.id);
    } else {
      result = simulateAgentTurn(state.game, currentPlayer.id);
    }
    let newState = state.game;

    if (result.dialogue) {
      state.dialogueLog = [...state.dialogueLog, result.dialogue];
    }

    if (result.accusation) {
      const out = makeAccusation(state.game, currentPlayer.id, result.accusation);
      newState = out.newState;
      if (out.correct) state.mode = 'won';
    } else if (result.suggestion) {
      const out = makeSuggestion(state.game, currentPlayer.id, result.suggestion);
      newState = advanceTurn(out.newState);
    }

    state.game = newState;
    render();
  });

  document.getElementById('btn-accuse')?.addEventListener('click', () => {
    if (!state.game || state.game.status !== 'playing') return;
    if (!humanPlayer || state.game.players[state.game.currentPlayerIndex].id !== humanPlayer.id) return;

    const room = (document.getElementById('sug-room') as HTMLSelectElement)?.value as Room;
    const char = (document.getElementById('sug-char') as HTMLSelectElement)?.value as Suggestion['character'];
    const weapon = (document.getElementById('sug-weapon') as HTMLSelectElement)?.value as Suggestion['weapon'];

    const { newState, correct } = makeAccusation(state.game, humanPlayer.id, {
      character: char,
      weapon,
      room,
    });
    state.game = newState;
    if (correct) state.mode = 'won';
    state.assistantPrompt = getAssistantPrompt();
    render();
  });

  document.getElementById('btn-run-assistant')?.addEventListener('click', async () => {
    const promptEl = document.getElementById('assistant-prompt') as HTMLTextAreaElement;
    const prompt = promptEl?.value?.trim() || getAssistantPrompt();
    state.assistantPrompt = prompt;
    state.assistantLoading = true;
    state.assistantError = '';
    render();

    const result = await callAssistant(prompt);
    state.assistantLoading = false;
    state.assistantError = result.error || '';
    state.assistantResponse = result.content || '';
    render();
  });

  document.getElementById('assistant-prompt')?.addEventListener('input', () => {
    state.assistantPrompt = (document.getElementById('assistant-prompt') as HTMLTextAreaElement)?.value || '';
  });
}

export function renderApp() {
  render();
}
