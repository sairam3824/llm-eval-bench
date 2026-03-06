import { Mistral } from '@mistralai/mistralai';

let client: Mistral | null = null;

function getClient(): Mistral {
  if (!client) {
    client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  }
  return client;
}

export async function callMistral(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const mistral = getClient();
  const start = Date.now();
  let firstTokenTime = 0;
  let fullResponse = '';

  const messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  try {
    const stream = await mistral.chat.stream({
      model: modelId,
      messages,
      maxTokens: 2048,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      const delta = event.data.choices[0]?.delta?.content;
      if (delta) {
        if (firstTokenTime === 0) firstTokenTime = Date.now() - start;
        fullResponse += delta;
      }
      if (event.data.usage) {
        inputTokens = event.data.usage.promptTokens;
        outputTokens = event.data.usage.completionTokens;
      }
    }

    if (inputTokens === 0) {
      inputTokens = Math.ceil(prompt.length / 4);
      outputTokens = Math.ceil(fullResponse.length / 4);
    }

    return {
      response: fullResponse,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - start,
      timeToFirstToken: firstTokenTime,
    };
  } catch (error: unknown) {
    throw new Error(`Mistral error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
