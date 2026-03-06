import { callOpenAISync } from '../providers';

export type JudgeResult = {
  score: number; // 1-10
  reasoning: string;
};

export async function judgeResponse(
  prompt: string,
  response: string,
  criteria: string[],
  judgeModel: string = 'gpt-4o'
): Promise<JudgeResult> {
  const criteriaText = criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const judgePrompt = `You are an expert AI evaluator. Score the following LLM response on a scale of 1-10.

ORIGINAL PROMPT:
${prompt}

LLM RESPONSE:
${response}

EVALUATION CRITERIA:
${criteriaText}

Evaluate the response against each criterion and provide:
1. A score from 1-10 (1=terrible, 5=average, 10=perfect)
2. Brief reasoning for the score

Respond in JSON format:
{
  "score": <number 1-10>,
  "reasoning": "<brief explanation>"
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

  try {
    const result = await callOpenAISync(judgeModel, judgePrompt);
    const parsed = JSON.parse(result.response.trim());
    return {
      score: Math.min(10, Math.max(1, Number(parsed.score))),
      reasoning: parsed.reasoning || '',
    };
  } catch {
    // Fallback scoring if judge fails
    return {
      score: 5,
      reasoning: 'Judge evaluation failed, using default score',
    };
  }
}
