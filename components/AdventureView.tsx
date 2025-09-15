
import React, { useState, useEffect, useRef } from 'react';
import type { StorySegment, Character } from '../types';
import { ABILITY_SCORE_MODIFIER } from '../constants';

interface AdventureViewProps {
  story: StorySegment;
  party: Character[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
}

// --- SVG Icons for Speech Controls ---
const PlayIcon: React.FC = () => (
    <svg className="h-5 w-5 text-stone-300 group-hover:text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const PauseIcon: React.FC = () => (
    <svg className="h-5 w-5 text-stone-300 group-hover:text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const StopIcon: React.FC = () => (
    <svg className="h-5 w-5 text-stone-300 group-hover:text-slate-900" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
);


const CharacterSheet: React.FC<{ character: Character, isCollapsed: boolean }> = ({ character, isCollapsed }) => {
    const renderModifier = (score: number) => {
        const mod = ABILITY_SCORE_MODIFIER(score);
        return mod >= 0 ? `+${mod}` : mod;
    }

    if (isCollapsed) {
        return (
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-amber-400 text-sm">{character.name}</h3>
                    <p className="text-xs text-stone-400">{character.race} {character.characterClass}</p>
                </div>
                 <div className="text-right">
                    <p className="font-bold text-red-400 text-sm">HP: {character.hp}/{character.maxHp}</p>
                    <p className="text-xs text-stone-500">Lvl {character.level}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-medieval text-xl text-amber-400">{character.name}</h3>
                    <p className="text-sm text-stone-400">Lvl {character.level} {character.race} {character.characterClass}</p>
                </div>
                <div className="bg-red-800/50 text-red-300 px-3 py-1 rounded-full text-center">
                    <span className="font-bold text-lg">{character.hp}</span>
                    <span className="text-xs">/{character.maxHp} HP</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center my-3">
                {Object.entries(character.abilityScores).map(([stat, value]) => (
                    <div key={stat} className="bg-slate-700/50 p-2 rounded">
                        <p className="text-xs uppercase text-stone-400">{stat.substring(0,3)}</p>
                        <p className="font-bold text-md text-amber-300">{value} <span className="text-stone-400 text-sm">({renderModifier(value)})</span></p>
                    </div>
                ))}
            </div>
             <p className="text-xs text-stone-500 mt-2 italic">"{character.backstory}"</p>
        </div>
    );
};


const AdventureView: React.FC<AdventureViewProps> = ({ story, party, onChoice, isLoading }) => {
    const [sheetsCollapsed, setSheetsCollapsed] = useState(true);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [speechStatus, setSpeechStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Load available voices
    useEffect(() => {
        if (!isSpeechSupported) return;
        const loadVoices = () => {
            setVoices(speechSynthesis.getVoices());
        };
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, [isSpeechSupported]);

    // Effect to handle speaking narration text
    useEffect(() => {
        if (!isSpeechSupported || !story.narration || voices.length === 0) {
            return;
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(story.narration);
        
        // Attempt to find a good storyteller voice
        const storytellerVoice = voices.find(voice => 
            voice.lang.startsWith('en-') && 
            (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Google') || voice.name.includes('Zira'))
        ) || voices.find(voice => voice.lang.startsWith('en-'));
        
        if (storytellerVoice) {
            utterance.voice = storytellerVoice;
        }
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Set up event listeners to sync state
        utterance.onstart = () => setSpeechStatus('speaking');
        utterance.onend = () => setSpeechStatus('idle');
        utterance.onpause = () => setSpeechStatus('paused');
        utterance.onresume = () => setSpeechStatus('speaking');
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            setSpeechStatus('idle');
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);

        // Cleanup on component unmount or when narration changes
        return () => {
            speechSynthesis.cancel();
        };
    }, [story.narration, voices, isSpeechSupported]);
    
    const handlePlayPause = () => {
        if (!isSpeechSupported) return;
        if (speechStatus === 'speaking') {
            speechSynthesis.pause();
        } else if (speechStatus === 'paused') {
            speechSynthesis.resume();
        } else if (speechStatus === 'idle' && utteranceRef.current) {
            // Re-play the last narration
            speechSynthesis.speak(utteranceRef.current);
        }
    };

    const handleStop = () => {
        if (!isSpeechSupported) return;
        speechSynthesis.cancel();
    };

    return (
        <div className="w-full min-h-screen bg-slate-900 flex flex-col md:flex-row p-4 gap-4">
            {/* Left Panel: Story */}
            <div className="w-full md:w-2/3 bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="font-medieval text-4xl text-amber-400 border-b-2 border-amber-400/20 pb-2">The Adventure Unfolds</h1>
                    {isSpeechSupported && story.narration && (
                        <div className="flex items-center gap-2">
                             <button onClick={handlePlayPause} title={speechStatus === 'speaking' ? 'Pause' : 'Play'} className="p-2 bg-slate-700 hover:bg-amber-600 rounded-full transition-colors duration-200 group disabled:bg-slate-800 disabled:cursor-not-allowed" disabled={speechStatus === 'idle' && !utteranceRef.current}>
                                {speechStatus === 'speaking' ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <button onClick={handleStop} title="Stop" className="p-2 bg-slate-700 hover:bg-red-600 rounded-full transition-colors duration-200 group disabled:bg-slate-800 disabled:cursor-not-allowed" disabled={speechStatus === 'idle'}>
                                <StopIcon />
                            </button>
                        </div>
                    )}
                </div>
                
                {story.imagePrompt && (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-slate-600">
                        <img src={`https://picsum.photos/seed/${story.imagePrompt.replace(/\s/g, '')}/800/400`} alt={story.imagePrompt} className="w-full object-cover" />
                    </div>
                )}
                
                <div className="prose prose-invert max-w-none text-stone-300 text-lg leading-relaxed flex-grow overflow-y-auto pr-2">
                   <p>{story.narration}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-600">
                    <h2 className="font-medieval text-2xl text-stone-300 mb-3">What do you do?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {story.choices.map((choice, i) => (
                            <button
                                key={i}
                                onClick={() => onChoice(choice)}
                                disabled={isLoading}
                                className="bg-slate-700 hover:bg-amber-600 hover:text-slate-900 border border-slate-600 text-stone-300 font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:bg-slate-800 disabled:text-stone-500 disabled:cursor-wait"
                            >
                                {isLoading ? "The DM is thinking..." : choice}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Party */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                 <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="font-medieval text-3xl text-stone-300">Your Party</h2>
                        <button 
                            onClick={() => setSheetsCollapsed(!sheetsCollapsed)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full"
                        >
                            {sheetsCollapsed ? "Show All" : "Collapse"}
                        </button>
                    </div>
                 </div>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {party.map(char => (
                        <CharacterSheet key={char.id} character={char} isCollapsed={sheetsCollapsed} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdventureView;
