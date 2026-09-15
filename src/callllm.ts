import { config } from "./config.js";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Sends a single prompt to the LLM and returns the plain text response.
 *
 * This is intentionally raw (no LangChain / AI SDK) — it's just a plain
 * `fetch` call to an OpenAI-compatible chat-completions endpoint. Seeing
 * this raw shape is the whole point: any framework you use later is just
 * a convenience wrapper around exactly this HTTP call.
 */
export async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      // 0.7, not 0 — this task is closer to creative writing (matching a
      // personal tone) than to factual data analysis, so a bit of
      // variation is desirable rather than perfectly deterministic output.
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM call failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as LLMResponse;
  return data.choices[0].message.content as string;
}