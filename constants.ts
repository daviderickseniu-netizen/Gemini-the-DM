
import { CharacterRace, CharacterClass, AbilityScores } from './types';

export const RACES = Object.values(CharacterRace);
export const CLASSES = Object.values(CharacterClass);

export const BASE_HP: Record<CharacterClass, number> = {
    [CharacterClass.Fighter]: 10,
    [CharacterClass.Wizard]: 6,
    [CharacterClass.Rogue]: 8,
    [CharacterClass.Cleric]: 8,
};

export const ABILITY_SCORE_MODIFIER = (score: number): number => {
    return Math.floor((score - 10) / 2);
}
