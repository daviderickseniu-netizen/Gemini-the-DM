
import React, { useState, useCallback, useEffect } from 'react';
import type { Character, CharacterRace, CharacterClass, AbilityScores } from '../types';
import { RACES, CLASSES } from '../constants';
import { generateBackstory } from '../services/geminiService';

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
  onBack: () => void;
}

interface CharacterCreationState {
  name: string;
  race: CharacterRace;
  characterClass: CharacterClass;
  abilityScores: AbilityScores | null;
}

const initialCharacterState = (): CharacterCreationState => ({
  name: '',
  race: RACES[0],
  characterClass: CLASSES[0],
  abilityScores: null,
});

const DiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 011.5 1.5v1.5h1.5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-1.5v1.5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5v-1.5H3.5a1.5 1.5 0 01-1.5-1.5v-5a1.5 1.5 0 011.5-1.5h1.5V5A1.5 1.5 0 016.5 3.5h3.5zm-3.5 12h5V14h-5v1.5zm0-3.5h5V12h-5v1.5zm0-3.5h5V8.5h-5V10zm0-3.5h5V5h-5v1.5zM5 14h1.5v1.5H5V14zm0-3.5h1.5v1.5H5V12zm0-3.5h1.5v1.5H5V8.5zm0-3.5h1.5v1.5H5V5zm10 10.5h-1.5V14H15v1.5zm0-3.5h-1.5V12H15v1.5zm0-3.5h-1.5V8.5H15V10zm0-3.5h-1.5V5H15v1.5z" />
    </svg>
);

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreated, onBack }) => {
  const [currentCharacter, setCurrentCharacter] = useState<CharacterCreationState>(initialCharacterState());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Roll stats automatically on component load for a quicker start
    rollAbilityScores();
  }, []);

  const rollAbilityScores = useCallback(() => {
    const rollStat = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b).shift();
      return rolls.reduce((sum, roll) => sum + roll, 0);
    };

    setCurrentCharacter(prev => ({
      ...prev,
      abilityScores: {
        strength: rollStat(),
        dexterity: rollStat(),
        constitution: rollStat(),
        intelligence: rollStat(),
        wisdom: rollStat(),
        charisma: rollStat(),
      }
    }));
  }, []);

  const handleCreateCharacter = async () => {
    if (!currentCharacter.name.trim()) {
      alert("Your hero must have a name!");
      return;
    }
    if (!currentCharacter.abilityScores) {
      alert("Please roll for ability scores.");
      return;
    }
    
    setIsLoading(true);

    const backstory = await generateBackstory({
        name: currentCharacter.name,
        race: currentCharacter.race,
        characterClass: currentCharacter.characterClass,
        level: 1,
        abilityScores: currentCharacter.abilityScores,
    });
    
    const newCharacter: Character = {
        id: Date.now(), // Use timestamp for a unique ID
        name: currentCharacter.name.trim(),
        race: currentCharacter.race,
        characterClass: currentCharacter.characterClass,
        level: 1,
        xp: 0,
        hp: 10, // Base HP, will be finalized when party is created
        maxHp: 10,
        abilityScores: currentCharacter.abilityScores,
        backstory,
    };
    
    onCharacterCreated(newCharacter);
  };
  
  const renderAbilityScores = (scores: AbilityScores | null) => {
    if (!scores) return <p className="text-center text-stone-400">Rolling stats...</p>;
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        {(Object.keys(scores) as Array<keyof AbilityScores>).map(key => (
          <div key={key} className="bg-slate-700/50 p-2 rounded">
            <p className="text-xs uppercase text-stone-400">{key.substring(0, 3)}</p>
            <p className="font-bold text-lg text-amber-300">{scores[key]}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h1 className="font-medieval text-4xl text-amber-400 mb-4">Forge a Hero</h1>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold mb-2 text-stone-400" htmlFor="name">Name</label>
                    <input type="text" id="name" value={currentCharacter.name} onChange={e => setCurrentCharacter(p => ({...p, name: e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-bold mb-2 text-stone-400" htmlFor="race">Race</label>
                    <select id="race" value={currentCharacter.race} onChange={e => setCurrentCharacter(p => ({...p, race: e.target.value as CharacterRace}))} className="w-full bg-slate-700 border border-slate-600 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-amber-400">
                        {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    </div>
                    <div>
                    <label className="block text-sm font-bold mb-2 text-stone-400" htmlFor="class">Class</label>
                    <select id="class" value={currentCharacter.characterClass} onChange={e => setCurrentCharacter(p => ({...p, characterClass: e.target.value as CharacterClass}))} className="w-full bg-slate-700 border border-slate-600 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-amber-400">
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-stone-400">Ability Scores</label>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        {renderAbilityScores(currentCharacter.abilityScores)}
                    </div>
                </div>
                <button onClick={rollAbilityScores} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition duration-300">
                    <DiceIcon /> Re-roll Stats
                </button>
                <button onClick={handleCreateCharacter} disabled={isLoading || !currentCharacter.abilityScores || !currentCharacter.name.trim()} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isLoading ? 'Generating Backstory...' : 'Add to Roster'}
                </button>
                 <button onClick={onBack} className="w-full mt-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                    Back
                </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CharacterCreator;
