import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '') as string });
  }
  return client;
}

export async function callAnthropic(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const anthropic = getClient();
  const start = Date.now();
  let firstTokenTime = 0;
  let fullResponse = '';

  try {
    const stream = await anthropic.messages.create({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        if (firstTokenTime === 0) firstTokenTime = Date.now() - start;
        fullResponse += event.delta.text;
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens;
      }
      if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
      }
    }

    return {
      response: fullResponse,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - start,
      timeToFirstToken: firstTokenTime,
    };
  } catch (error: unknown) {
    throw new Error(`Anthropic error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
