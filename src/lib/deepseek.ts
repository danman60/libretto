/**
 * DeepSeek API client for LLM calls.
 * Uses the OpenAI-compatible API format.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callDeepSeek(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const messages: DeepSeekMessage[] = [];

  if (options?.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call DeepSeek and parse the response as JSON.
 * Retries once with a stricter prompt if parsing fails.
 */
export async function callDeepSeekJSON<T>(prompt: string): Promise<T> {
  const raw = await callDeepSeek(prompt, { temperature: 0.6 });

  // Try to extract JSON from the response (handle markdown code fences)
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Retry with stricter instructions
    console.warn('First JSON parse failed, retrying with stricter prompt');
    const retryRaw = await callDeepSeek(
      prompt + '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY a valid JSON object. No markdown, no code fences, no explanations.',
      { temperature: 0.3 }
    );

    let retryStr = retryRaw.trim();
    const retryFence = retryStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (retryFence) {
      retryStr = retryFence[1].trim();
    }

    return JSON.parse(retryStr) as T;
  }
}
