import type { DialogueContext } from './types';

/**
 * Attempts to fetch a dialogue line from the Anthropic Claude API.
 *
 * Returns the generated string if VITE_ANTHROPIC_API_KEY is set and the call
 * succeeds, or null if the key is absent (or the call fails). Callers fall back
 * to the template system when null is returned:
 *
 *   const line = await getClaudeDialogue(prompt, ctx)
 *     ?? getDialogueLine(role, node, ctx, species).npcLine;
 */
export async function getClaudeDialogue(
  prompt: string,
  context: DialogueContext,
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) return null;

  const systemPrompt = buildSystemPrompt(context);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 256,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.warn('[ClaudeDialogue] API returned', response.status);
      return null;
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content.find((b) => b.type === 'text')?.text ?? null;
    return text ?? null;
  } catch (err) {
    console.warn('[ClaudeDialogue] Request failed:', err);
    return null;
  }
}

function buildSystemPrompt(ctx: DialogueContext): string {
  return [
    'You are an NPC in Hoard & Holdings, a fantasy dragon real estate tycoon game.',
    `The player is ${ctx.playerName}, a ${ctx.dragonBreed} dragon.`,
    `Player stats — Gold: ${ctx.gold} | Dread Rating: ${ctx.dreadRating} | Day: ${ctx.currentDay} | Age: ${ctx.dragonAge}.`,
    ctx.propertyName  ? `Current property under discussion: ${ctx.propertyName} (price: ${ctx.price ?? '?'} gold).` : '',
    ctx.rivalName     ? `Rival dragon in this scene: ${ctx.rivalName}.` : '',
    ctx.koboldName    ? `Kobold in question: ${ctx.koboldName}.` : '',
    ctx.economyMultiplier !== undefined
      ? `Current economy multiplier: ${ctx.economyMultiplier}x.`
      : '',
    ctx.relationshipScore !== undefined
      ? `Relationship score with player: ${ctx.relationshipScore}.`
      : '',
    '',
    'Stay in character. Keep responses under three sentences. Match the NPC voice established in the conversation.',
  ]
    .filter(Boolean)
    .join('\n');
}
