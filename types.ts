
export enum GameState {
  START_MENU,
  CHARACTER_CREATION,
  PARTY_SELECTION,
  HALL_OF_HEROES,
  ADVENTURE,
  COMBAT,
  TOWN,
  GAME_OVER,
}

export enum CharacterClass {
  Fighter = "Fighter",
  Wizard = "Wizard",
  Rogue = "Rogue",
  Cleric = "Cleric",
}

export enum CharacterRace {
  Human = "Human",
  Elf = "Elf",
  Dwarf = "Dwarf",
  Halfling = "Halfling",
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: number;
  name: string;
  race: CharacterRace;
  characterClass: CharacterClass;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  abilityScores: AbilityScores;
  backstory: string;
}

export interface Monster {
    name: string;
    hp: number;
    maxHp: number;
    attack: string;
    description: string;
}

export interface CombatEncounter {
    monster: Monster;
    narration: string;
}

export interface StorySegment {
    narration: string;
    choices: string[];
    imagePrompt?: string;
}