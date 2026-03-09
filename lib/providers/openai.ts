import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || '') as string });
  }
  return client;
}

export async function callOpenAI(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const openai = getClient();
  const start = Date.now();
  let firstTokenTime = 0;
  let fullResponse = '';
  let inputTokens = 0;
  let outputTokens = 0;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  try {
    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      max_tokens: 2048,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      if (firstTokenTime === 0 && chunk.choices[0]?.delta?.content) {
        firstTokenTime = Date.now() - start;
      }
      fullResponse += chunk.choices[0]?.delta?.content || '';
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
      }
    }

    // Fallback token estimate
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
    throw new Error(`OpenAI error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function callOpenAISync(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const openai = getClient();
  const start = Date.now();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await openai.chat.completions.create({
      model: modelId,
      messages,
      max_tokens: 2048,
    });

    const latency = Date.now() - start;
    return {
      response: completion.choices[0]?.message?.content || '',
      inputTokens: completion.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
      outputTokens: completion.usage?.completion_tokens || 0,
      latencyMs: latency,
      timeToFirstToken: Math.floor(latency * 0.3),
    };
  } catch (error: unknown) {
    throw new Error(`OpenAI error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
