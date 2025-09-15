
import React, { useState, useCallback, useEffect } from 'react';
import type { Character, StorySegment, CombatEncounter } from './types';
import { GameState } from './types';
import { BASE_HP, ABILITY_SCORE_MODIFIER } from './constants';
import { getOpeningScene, getNextStorySegment, getCombatActionNarration } from './services/geminiService';
import * as storage from './services/storageService';
import CharacterCreator from './components/CharacterCreator';
import AdventureView from './components/AdventureView';
import CombatView from './components/CombatView';


const StartMenu: React.FC<{ 
    onContinue: () => void, 
    onNewGame: () => void,
    onManageHeroes: () => void,
    hasSavedGame: boolean 
}> = ({ onContinue, onNewGame, onManageHeroes, hasSavedGame }) => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-4" style={{backgroundImage: 'radial-gradient(circle at top, #334155, #0f172a 80%)'}}>
        <h1 className="font-medieval text-7xl md:text-8xl text-amber-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)]">Gemini</h1>
        <h2 className="font-medieval text-5xl md:text-6xl text-stone-300 mb-8 drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)]">Dungeon Master</h2>
        <div className="flex flex-col space-y-4 w-full max-w-sm">
             {hasSavedGame && (
                <button
                    onClick={onContinue}
                    className="font-medieval text-3xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-10 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                    Continue Adventure
                </button>
             )}
            <button
                onClick={onNewGame}
                className="font-medieval text-3xl bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 px-10 rounded-lg transition duration-300 transform hover:scale-105"
            >
                New Adventure
            </button>
            <button
                onClick={onManageHeroes}
                className="font-medieval text-2xl text-stone-400 hover:text-amber-400 font-bold py-2 px-8 rounded-lg transition duration-300"
            >
                Hall of Heroes
            </button>
        </div>
    </div>
);

const CharacterCard: React.FC<{character: Character, onSelect?: () => void, onDelete?: () => void, isSelected?: boolean}> = ({ character, onSelect, onDelete, isSelected }) => (
    <div 
        className={`bg-slate-800 p-4 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-amber-400 scale-105' : 'border-slate-700'} ${onSelect ? 'cursor-pointer hover:border-amber-400' : ''}`}
        onClick={onSelect}
    >
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-amber-400">{character.name}</h3>
                <p className="text-sm text-stone-400">Lvl {character.level} {character.race} {character.characterClass}</p>
            </div>
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs text-red-400 hover:text-red-200">Delete</button>}
        </div>
        <p className="text-xs text-stone-500 mt-2 italic">"{character.backstory}"</p>
    </div>
);


const PartySelection: React.FC<{
    roster: Character[];
    onStart: (party: Character[]) => void;
    onCreate: () => void;
    onBack: () => void;
}> = ({ roster, onStart, onCreate, onBack }) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(charId => charId !== id)
                : [...prev, id]
        );
    };

    const handleStart = () => {
        const selectedChars = roster.filter(c => selectedIds.includes(c.id));
        onStart(selectedChars);
    };

    const canStart = selectedIds.length > 0 && selectedIds.length <= 6;

    return (
        <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
            <h1 className="font-medieval text-5xl text-amber-400 mb-2 text-center">Assemble Your Party</h1>
            <p className="text-stone-400 mb-8 text-center">Select 1 to 6 heroes from your roster for this adventure.</p>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {roster.map(char => (
                    <CharacterCard 
                        key={char.id} 
                        character={char}
                        onSelect={() => toggleSelection(char.id)}
                        isSelected={selectedIds.includes(char.id)}
                    />
                ))}
            </div>

            {roster.length === 0 && <p className="text-center text-stone-500">Your roster is empty. Create a hero to begin!</p>}

            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
                 <button onClick={onCreate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition">Create New Hero</button>
                 <button onClick={handleStart} disabled={!canStart} className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-slate-600 disabled:cursor-not-allowed">
                    Embark! ({selectedIds.length}/6)
                 </button>
                 <button onClick={onBack} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition">Back to Menu</button>
            </div>
        </div>
    );
};


const HallOfHeroes: React.FC<{
    roster: Character[];
    onDelete: (characterId: number) => void;
    onCreate: () => void;
    onBack: () => void;
}> = ({ roster, onDelete, onCreate, onBack }) => {
     const handleDelete = (char: Character) => {
        if (window.confirm(`Are you sure you want to delete ${char.name} the ${char.characterClass}? This action cannot be undone.`)) {
            onDelete(char.id);
        }
    }
    return (
         <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
            <h1 className="font-medieval text-5xl text-amber-400 mb-2 text-center">Hall of Heroes</h1>
            <p className="text-stone-400 mb-8 text-center">Manage your roster of created adventurers.</p>
            
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {roster.map(char => (
                    <CharacterCard 
                        key={char.id} 
                        character={char}
                        onDelete={() => handleDelete(char)}
                    />
                ))}
            </div>

            {roster.length === 0 && <p className="text-center text-stone-500">Your roster is empty. Go create some heroes!</p>}

            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
                 <button onClick={onCreate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition">Create New Hero</button>
                 <button onClick={onBack} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition">Back to Menu</button>
            </div>
        </div>
    );
}


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
    const [party, setParty] = useState<Character[]>([]);
    const [story, setStory] = useState<StorySegment | null>(null);
    const [encounter, setEncounter] = useState<CombatEncounter | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [characterRoster, setCharacterRoster] = useState<Character[]>([]);
    const [hasSavedGame, setHasSavedGame] = useState(false);

    // Load data on initial mount
    useEffect(() => {
        const roster = storage.loadCharacters();
        setCharacterRoster(roster);
        const savedGame = storage.loadGame();
        setHasSavedGame(!!savedGame);
    }, []);

    // Autosave adventure progress
    useEffect(() => {
        if (gameState === GameState.ADVENTURE || gameState === GameState.COMBAT) {
            storage.saveGame({ gameState, party, story, encounter });
            setHasSavedGame(true);
        }
    }, [gameState, party, story, encounter]);


    const handleContinueGame = () => {
        const savedGame = storage.loadGame();
        if (savedGame) {
            setGameState(savedGame.gameState);
            setParty(savedGame.party);
            setStory(savedGame.story);
            setEncounter(savedGame.encounter);
        }
    };

    const handleNewGame = () => {
        storage.clearSavedGame();
        setHasSavedGame(false);
        setStory(null);
        setEncounter(null);
        setParty([]);
        if (characterRoster.length === 0) {
            setGameState(GameState.CHARACTER_CREATION);
        } else {
            setGameState(GameState.PARTY_SELECTION);
        }
    };
    
    const handleStartAdventure = useCallback((selectedParty: Character[]) => {
        const finalParty = selectedParty.map(char => {
            const conModifier = ABILITY_SCORE_MODIFIER(char.abilityScores.constitution);
            const hp = BASE_HP[char.characterClass] + conModifier;
            return { ...char, hp, maxHp: hp, level: 1, xp: 0 }; // Reset level/xp for new adventure
        });
        setParty(finalParty);
        setGameState(GameState.ADVENTURE);
        setIsLoading(true);
    }, []);

    const handleCharacterCreated = (newCharacter: Character) => {
        const updatedRoster = [...characterRoster, newCharacter];
        setCharacterRoster(updatedRoster);
        storage.saveCharacters(updatedRoster);
        setGameState(GameState.PARTY_SELECTION);
    };

    const handleDeleteCharacter = (characterId: number) => {
        const updatedRoster = characterRoster.filter(c => c.id !== characterId);
        setCharacterRoster(updatedRoster);
        storage.saveCharacters(updatedRoster);
    };

    // Fetch opening scene when adventure starts
    useEffect(() => {
        if (gameState === GameState.ADVENTURE && party.length > 0 && !story) {
            const fetchOpeningScene = async () => {
                const openingScene = await getOpeningScene(party);
                setStory(openingScene);
                setIsLoading(false);
            };
            fetchOpeningScene();
        }
    }, [gameState, party, story]);

    const handleChoice = async (choice: string) => {
        if (!story) return;
        setIsLoading(true);
        const result = await getNextStorySegment(party, story.narration, choice);

        if ('combat' in result) {
            setEncounter(result.combat);
            setGameState(GameState.COMBAT);
        } else {
            setStory(result);
        }
        setIsLoading(false);
    };

    const handleCombatAction = async (characterId: number, action: string, roll: number, modifier: number) => {
        if (!encounter) return;
        
        setIsLoading(true);
        const character = party.find(c => c.id === characterId)!;
        const result = await getCombatActionNarration(party, character, encounter.monster, action, roll, modifier);
        const updatedMonsterHp = Math.max(0, encounter.monster.hp - result.damageToMonster);
        
        const updatedParty = [...party];
        if(!result.monsterDefeated && result.damageToPlayer > 0) {
            const targetIndex = Math.floor(Math.random() * party.length);
            updatedParty[targetIndex] = {
                ...updatedParty[targetIndex],
                hp: Math.max(0, updatedParty[targetIndex].hp - result.damageToPlayer)
            }
        }
        setParty(updatedParty);

        if (result.monsterDefeated) {
             setTimeout(() => {
                setGameState(GameState.ADVENTURE);
                setEncounter(null);
                handleChoice("The monster is defeated. What's next?");
            }, 2000);
            setEncounter({ ...encounter, narration: encounter.narration + "\n\n" + result.narration, monster: {...encounter.monster, hp: 0 } });
        } else {
            setEncounter({ monster: { ...encounter.monster, hp: updatedMonsterHp }, narration: encounter.narration + "\n\n" + result.narration });
        }
        setIsLoading(false);
    };

    const renderGameState = () => {
        switch (gameState) {
            case GameState.START_MENU:
                return <StartMenu 
                    onContinue={handleContinueGame} 
                    onNewGame={handleNewGame}
                    onManageHeroes={() => setGameState(GameState.HALL_OF_HEROES)}
                    hasSavedGame={hasSavedGame} 
                />;
            case GameState.CHARACTER_CREATION:
                return <CharacterCreator 
                    onCharacterCreated={handleCharacterCreated} 
                    onBack={() => setGameState(characterRoster.length > 0 ? GameState.PARTY_SELECTION : GameState.START_MENU)}
                />;
            case GameState.PARTY_SELECTION:
                return <PartySelection 
                    roster={characterRoster}
                    onStart={handleStartAdventure}
                    onCreate={() => setGameState(GameState.CHARACTER_CREATION)}
                    onBack={() => setGameState(GameState.START_MENU)}
                />
            case GameState.HALL_OF_HEROES:
                return <HallOfHeroes
                    roster={characterRoster}
                    onDelete={handleDeleteCharacter}
                    onCreate={() => setGameState(GameState.CHARACTER_CREATION)}
                    onBack={() => setGameState(GameState.START_MENU)}
                />
            case GameState.ADVENTURE:
                if (isLoading && !story) {
                    return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl animate-pulse">The Dungeon Master is preparing your adventure...</p></div>;
                }
                if (story) {
                    return <AdventureView story={story} party={party} onChoice={handleChoice} isLoading={isLoading} />;
                }
                return null;
            case GameState.COMBAT:
                if (encounter) {
                    return <CombatView encounter={encounter} party={party} onCombatAction={handleCombatAction} isLoading={isLoading} />;
                }
                return null;
            default:
                return <div>Game State Not Implemented</div>;
        }
    };

    return <div className="App">{renderGameState()}</div>;
};

export default App;
