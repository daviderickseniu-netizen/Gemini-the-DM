
import type { Character, GameState, StorySegment, CombatEncounter } from '../types';

const CHARACTERS_KEY = 'gemini_dnd_characters';
const SAVED_GAME_KEY = 'gemini_dnd_saved_game';

export interface SavedGame {
    gameState: GameState;
    party: Character[];
    story: StorySegment | null;
    encounter: CombatEncounter | null;
}

// Character Roster Management
export const loadCharacters = (): Character[] => {
    try {
        const charactersJson = localStorage.getItem(CHARACTERS_KEY);
        return charactersJson ? JSON.parse(charactersJson) : [];
    } catch (error) {
        console.error("Failed to load characters:", error);
        return [];
    }
};

export const saveCharacters = (characters: Character[]): void => {
    try {
        localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    } catch (error) {
        console.error("Failed to save characters:", error);
    }
};


// Saved Game Management
export const loadGame = (): SavedGame | null => {
    try {
        const savedGameJson = localStorage.getItem(SAVED_GAME_KEY);
        if (!savedGameJson) return null;
        
        const savedGame: SavedGame = JSON.parse(savedGameJson);
        // Basic validation
        if (savedGame && savedGame.party && savedGame.gameState) {
            return savedGame;
        }
        return null;
    } catch (error) {
        console.error("Failed to load game:", error);
        return null;
    }
};

export const saveGame = (game: SavedGame): void => {
    try {
        localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(game));
    } catch (error) {
        console.error("Failed to save game:", error);
    }
};

export const clearSavedGame = (): void => {
    try {
        localStorage.removeItem(SAVED_GAME_KEY);
    } catch (error) {
        console.error("Failed to clear saved game:", error);
    }
};
