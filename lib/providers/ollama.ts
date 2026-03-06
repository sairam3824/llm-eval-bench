const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function callOllama(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number; timeToFirstToken: number }> {
  const start = Date.now();
  let firstTokenTime = 0;
  let fullResponse = '';

  const body = {
    model: modelId,
    prompt,
    system: systemPrompt,
    stream: true,
  };

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Ollama HTTP error: ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            if (firstTokenTime === 0) firstTokenTime = Date.now() - start;
            fullResponse += data.response;
          }
          if (data.done && data.prompt_eval_count) {
            inputTokens = data.prompt_eval_count;
            outputTokens = data.eval_count || Math.ceil(fullResponse.length / 4);
          }
        } catch {}
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
    throw new Error(`Ollama error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
