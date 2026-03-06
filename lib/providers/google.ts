import { GoogleGenerativeAI } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }
  return client;
}

export async function callGoogle(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const genAI = getClient();
  const start = Date.now();
  let firstTokenTime = 0;
  let fullResponse = '';

  try {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text && firstTokenTime === 0) {
        firstTokenTime = Date.now() - start;
      }
      fullResponse += text;
    }

    const finalResponse = await result.response;
    const inputTokens = finalResponse.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const outputTokens = finalResponse.usageMetadata?.candidatesTokenCount || Math.ceil(fullResponse.length / 4);

    return {
      response: fullResponse,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - start,
      timeToFirstToken: firstTokenTime,
    };
  } catch (error: unknown) {
    throw new Error(`Google error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
