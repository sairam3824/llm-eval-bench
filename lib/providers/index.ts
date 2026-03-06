import { callOpenAI, callOpenAISync } from './openai';
import { callAnthropic } from './anthropic';
import { callGoogle } from './google';
import { callMistral } from './mistral';
import { callOllama } from './ollama';

export type ProviderResponse = {
  response: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  timeToFirstToken: number;
};

export async function callProvider(
  provider: string,
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ProviderResponse> {
  switch (provider.toLowerCase()) {
    case 'openai':
      return callOpenAI(modelId, prompt, systemPrompt);
    case 'anthropic':
      return callAnthropic(modelId, prompt, systemPrompt);
    case 'google':
      return callGoogle(modelId, prompt, systemPrompt);
    case 'mistral':
      return callMistral(modelId, prompt, systemPrompt);
    case 'ollama':
      return callOllama(modelId, prompt, systemPrompt);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export { callOpenAISync };
