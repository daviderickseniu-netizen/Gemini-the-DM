
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
// Fix: Imported `CombatEncounter` to resolve a type error.
import type { Character, StorySegment, Monster, CombatEncounter } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const getSystemInstruction = (party: Character[]) => {
    const partyDescription = party.map(c => 
        `- ${c.name} the ${c.race} ${c.characterClass} (Level ${c.level})`
    ).join('\n');

    return `You are a world-class Dungeon Master for a Dungeons & Dragons style adventure.
Your primary goal is to create a fun, engaging, and collaborative storytelling experience.
The tone should be epic fantasy, descriptive, and slightly dramatic.
Always focus on the story and player enjoyment over punishing difficulty. The players should feel heroic.
You will guide a party of ${party.length} adventurer${party.length > 1 ? 's' : ''}. Do not let the character(s) die permanently; if they fall, they can be revived or saved.

The current adventuring party consists of:
${partyDescription}

You must respond in JSON format. Do not include any markdown formatting like \`\`\`json.
`;
};

export const generateBackstory = async (character: Omit<Character, 'id' | 'backstory' | 'hp' | 'maxHp' | 'xp'>): Promise<string> => {
    try {
        const prompt = `Generate a brief, compelling backstory (2-3 sentences) for a level 1 ${character.race} ${character.characterClass} named ${character.name}. 
        Make it fit a classic fantasy setting.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a creative writer specializing in fantasy character backstories."
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating backstory:", error);
        return "A mysterious past shrouded in shadow...";
    }
};

export const getOpeningScene = async (party: Character[]): Promise<StorySegment> => {
    const partySize = party.length;
    const heroText = partySize > 1 ? `our ${partySize} heroes` : `our hero`;
    const bringTogetherText = partySize > 1 ? `that brings them together for the first time` : `that sets them on their path`;

    const prompt = `The adventure is just beginning for ${heroText}. Create an exciting opening scene ${bringTogetherText}.
    They are in a bustling town square or a cozy tavern. Describe the scene vividly and present them with a clear, intriguing hook for their first quest.
    Give them 2-3 clear choices of action to start their adventure. 
    Also, provide a short DALL-E style prompt for an image that captures the essence of this scene.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(party),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    narration: { type: Type.STRING },
                    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                }
            }
        },
    });

    return JSON.parse(response.text);
};


export const getNextStorySegment = async (party: Character[], previousNarration: string, userChoice: string): Promise<StorySegment | { combat: CombatEncounter }> => {
    const prompt = `The story so far: "${previousNarration}"
The party chose to: "${userChoice}"

Continue the story. Describe the outcome of their choice.
- If the story continues peacefully, present the next scene and 2-3 new choices.
- If their choice leads to combat, introduce a monster or group of monsters fitting the scenario. Describe the monster and the tension of the moment, then stop.
- Occasionally, their path might lead them to a village or town. If so, indicate this.
- Also, provide a short DALL-E style prompt for an image that captures the essence of this new scene.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(party),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    narration: { type: Type.STRING },
                    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING },
                    combat: {
                        type: Type.OBJECT,
                        properties: {
                            monster: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    hp: { type: Type.INTEGER },
                                    attack: { type: Type.STRING, description: "A brief description of the monster's main attack" },
                                    description: { type: Type.STRING }
                                }
                            },
                            narration: { type: Type.STRING, description: "The narration introducing the combat." }
                        }
                    },
                    town: {
                        type: Type.BOOLEAN,
                        description: "Set to true if the party has entered a town."
                    }
                }
            },
        },
    });

    const result = JSON.parse(response.text);

    if (result.combat) {
        return {
            combat: {
                monster: { ...result.combat.monster, maxHp: result.combat.monster.hp },
                narration: result.combat.narration
            }
        };
    }
    
    if (result.town) {
      return { narration: result.narration, choices: ["Visit the Tavern", "Go to the Shop", "Rest at the Inn", "Leave Town"] }
    }

    return {
        narration: result.narration,
        choices: result.choices,
        imagePrompt: result.imagePrompt
    };
};

export const getCombatActionNarration = async (party: Character[], character: Character, monster: Monster, action: string, diceRoll: number, modifier: number): Promise<{ narration: string, damageToMonster: number, damageToPlayer: number, monsterDefeated: boolean }> => {
    const prompt = `**Combat Turn**
Character: ${character.name} the ${character.race} ${character.characterClass}
Action: ${action}
Dice Roll (d20): ${diceRoll}
Ability Modifier: ${modifier}
Total: ${diceRoll + modifier}

Monster: ${monster.name} (HP: ${monster.hp})
Monster's Attack Style: ${monster.attack}

Narrate the outcome of ${character.name}'s action.
- A roll of 1 is a critical failure. Describe a humorous or clumsy miss.
- A roll of 20 is a critical success. Describe a spectacular, powerful hit with extra damage.
- A roll + modifier below 12 is likely a miss.
- A roll + modifier of 12 or higher is a hit.
- A hit should deal damage. Calculate appropriate damage based on the aharacter class (Fighters do more, Wizards less with physical attacks).
- After the player's action, describe the monster's counter-attack. The monster attacks one random player.
- Calculate damage the monster deals.
- If the monster's HP drops to 0 or below, declare it defeated and describe its dramatic end.

Return ONLY the JSON object.
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(party),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    narration: { type: Type.STRING, description: "A vivid description of both the player's action and the monster's counter-attack." },
                    damageToMonster: { type: Type.INTEGER, description: "The amount of damage dealt to the monster." },
                    damageToPlayer: { type: Type.INTEGER, description: "The amount of damage dealt to a random player by the monster." },
                    monsterDefeated: { type: Type.BOOLEAN, description: "True if the monster's HP is 0 or less." }
                }
            }
        },
    });

    return JSON.parse(response.text);
};
