
import React, { useState } from 'react';
import type { CombatEncounter, Character } from '../types';
import { ABILITY_SCORE_MODIFIER, BASE_HP } from '../constants';

interface CombatViewProps {
  encounter: CombatEncounter;
  party: Character[];
  onCombatAction: (characterId: number, action: string, roll: number, modifier: number) => void;
  isLoading: boolean;
}

const DiceRoller: React.FC<{ onRoll: (result: number) => void }> = ({ onRoll }) => {
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState<number | null>(null);

    const rollD20 = () => {
        setRolling(true);
        setResult(null);
        let rollCount = 0;
        const interval = setInterval(() => {
            setResult(Math.floor(Math.random() * 20) + 1);
            rollCount++;
            if (rollCount > 10) {
                clearInterval(interval);
                const finalResult = Math.floor(Math.random() * 20) + 1;
                setResult(finalResult);
                setRolling(false);
                onRoll(finalResult);
            }
        }, 50);
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`w-24 h-24 border-4 ${result === 1 ? 'border-red-500' : result === 20 ? 'border-green-500' : 'border-slate-500'} bg-slate-800 rounded-lg flex items-center justify-center font-bold text-5xl transition-all duration-300 ${rolling ? 'animate-spin' : ''}`}>
                {result}
            </div>
            <button
                onClick={rollD20}
                disabled={rolling}
                className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition duration-300 disabled:bg-slate-600"
            >
                {rolling ? 'Rolling...' : 'Roll d20'}
            </button>
        </div>
    );
}

const CombatView: React.FC<CombatViewProps> = ({ encounter, party, onCombatAction, isLoading }) => {
    const [activeCharacterId, setActiveCharacterId] = useState(party[0].id);
    const [rollResult, setRollResult] = useState<number | null>(null);
    const [actionTaken, setActionTaken] = useState(false);
    
    const activeCharacter = party.find(c => c.id === activeCharacterId)!;
    
    const getModifier = (char: Character): number => {
        switch(char.characterClass) {
            case 'Fighter': return ABILITY_SCORE_MODIFIER(char.abilityScores.strength);
            case 'Rogue': return ABILITY_SCORE_MODIFIER(char.abilityScores.dexterity);
            case 'Wizard': return ABILITY_SCORE_MODIFIER(char.abilityScores.intelligence);
            case 'Cleric': return ABILITY_SCORE_MODIFIER(char.abilityScores.wisdom);
            default: return 0;
        }
    }
    
    const handleRoll = (result: number) => {
        setRollResult(result);
    }
    
    const handleAction = (action: string) => {
        if (rollResult === null) {
            alert("You must roll the d20 first!");
            return;
        }
        setActionTaken(true);
        onCombatAction(activeCharacterId, action, rollResult, getModifier(activeCharacter));
    }
    
    const nextTurn = () => {
        const currentIndex = party.findIndex(c => c.id === activeCharacterId);
        const nextIndex = (currentIndex + 1) % party.length;
        setActiveCharacterId(party[nextIndex].id);
        setRollResult(null);
        setActionTaken(false);
    }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4" style={{backgroundImage: 'radial-gradient(circle at center, #334155, #0f172a 70%)'}}>
        <div className="w-full max-w-5xl bg-slate-800/50 border-2 border-red-500/50 rounded-lg shadow-2xl p-8">
            {/* Monster Info */}
            <div className="text-center mb-6">
                <h1 className="font-medieval text-5xl text-red-400">{encounter.monster.name}</h1>
                <p className="text-stone-400 italic mt-2">{encounter.monster.description}</p>
                <div className="mt-4 w-full bg-slate-700 rounded-full h-6 border-2 border-slate-600">
                    <div 
                        className="bg-red-600 h-full rounded-full transition-all duration-500"
                        style={{width: `${(encounter.monster.hp / encounter.monster.maxHp) * 100}%`}}
                    ></div>
                </div>
                 <p className="text-sm font-bold text-red-300 mt-1">{encounter.monster.hp} / {encounter.monster.maxHp} HP</p>
            </div>

            {/* Combat Log */}
            <div className="h-40 bg-slate-900/70 rounded-lg p-4 mb-6 border border-slate-700 overflow-y-auto">
                <p className="text-stone-300">{encounter.narration}</p>
            </div>

            {/* Party & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Party Status */}
                <div className="space-y-2">
                    {party.map(char => (
                        <div key={char.id} className={`p-3 rounded-lg border-2 transition-all duration-300 ${char.id === activeCharacterId ? 'border-amber-400 bg-slate-700/50 scale-105' : 'border-slate-700 bg-slate-800/50'}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-stone-300">{char.name}</h4>
                                <p className="font-bold text-red-400">{char.hp}/{char.maxHp} HP</p>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
                                <div className="bg-red-500 h-2 rounded-full" style={{width: `${(char.hp / char.maxHp) * 100}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Action Controls */}
                <div className="flex flex-col items-center justify-center">
                    <p className="font-medieval text-2xl text-amber-400 mb-4">{activeCharacter.name}'s Turn</p>
                    {!actionTaken && <DiceRoller onRoll={handleRoll} />}
                    {rollResult !== null && !actionTaken && (
                        <div className="mt-4 space-x-2 animate-fade-in">
                            <button onClick={() => handleAction('Attack')} className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Attack</button>
                            <button onClick={() => handleAction('Defend')} className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Defend</button>
                        </div>
                    )}
                    {actionTaken && (
                         <button onClick={nextTurn} disabled={isLoading} className="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:bg-slate-600">
                             {isLoading ? "DM is Narrating..." : "Next Turn"}
                         </button>
                    )}
                </div>
                
                {/* Character Info */}
                <div className="text-center bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-amber-400">{activeCharacter.name}</h3>
                    <p className="text-sm text-stone-400">{activeCharacter.characterClass}</p>
                    <p className="mt-4">Modifier: <span className="font-bold text-xl text-amber-300">{getModifier(activeCharacter) >= 0 ? '+' : ''}{getModifier(activeCharacter)}</span></p>
                    {rollResult !== null && <p>Total Roll: <span className="font-bold text-xl text-white">{rollResult + getModifier(activeCharacter)}</span></p>}
                </div>

            </div>
        </div>
    </div>
  );
};

export default CombatView;
