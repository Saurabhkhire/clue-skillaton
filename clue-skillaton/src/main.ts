import './styles.css';
import { renderApp } from './app/App';

// Each run = fresh game: clear any persisted game state
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.removeItem('clue-game-state');
}
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('clue-game-state');
}

renderApp();
