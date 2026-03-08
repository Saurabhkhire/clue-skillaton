/**
 * Load Sundial skill content for use in AI Assistant and Agent players
 */

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content;
}

// Raw skill content - loaded at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite handles ?raw
import clueAssistantRaw from '../../skills/clue-assistant/SKILL.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cluePlayerRaw from '../../skills/clue-player/SKILL.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import clueModeratorRaw from '../../skills/clue-moderator/SKILL.md?raw';

export const CLUE_ASSISTANT_SKILL = stripFrontmatter(
  typeof clueAssistantRaw === 'string' ? clueAssistantRaw : '',
);
export const CLUE_PLAYER_SKILL = stripFrontmatter(
  typeof cluePlayerRaw === 'string' ? cluePlayerRaw : '',
);
export const CLUE_MODERATOR_SKILL = stripFrontmatter(
  typeof clueModeratorRaw === 'string' ? clueModeratorRaw : '',
);
