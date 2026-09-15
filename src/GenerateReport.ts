import { callLLM } from "./callllm.js";
import { fetchGithubActivity, type ActivityItem } from "./FetchGithubActivity.js";
import { collectManualBullets } from "./ManualInput.js";
import { getVoiceContext } from "./VoiceExamples.example.js";

export function formatGithubActivity(activity: ActivityItem[]): string {
  if (activity.length === 0) {
    return "(no GitHub activity found this week)";
  }

  return activity.map((item) => `- [${item.type}] ${item.title}`).join("\n");
}

export function formatManualBullets(bullets: string[]): string {
  if (bullets.length === 0) {
    return ""; // Empty string — this section simply won't appear in the prompt
  }

  return bullets.map((b) => `- ${b}`).join("\n");
}

/**
 * A second, separate LLM call whose only job is to critique the draft —
 * not generate new content. This is the Reflexion pattern: generate,
 * then self-check, then optionally fix.
 *
 * Skipped entirely when there are no voice examples, since there's
 * nothing style-related to check in that case — no point spending an
 * extra API call on a check that can't find anything meaningful.
 */
async function reflectAndRefine(draft: string, hasVoiceExamples: boolean): Promise<string> {
  if (!hasVoiceExamples) {
    return draft;
  }

  const critiquePrompt = `
Below is a draft summary. Check two things:

1. Did any content from the OLD example posts leak into this draft
   (something that didn't actually happen this week)?
2. Does the tone sound generic/robotic rather than like a real person's
   natural writing style?
3. Does the draft consistently describe one developer using first-person
  singular language ("I", "my", "me") rather than "we" or "the team"?

Draft:
"${draft}"

If both are fine, reply with exactly "OK".
If there's a problem, give one short reason (a single line).
`;

  const critique = await callLLM(critiquePrompt);

  if (critique.trim().toUpperCase().startsWith("OK")) {
    return draft;
  }

  console.log(`\n(Refining — reason: ${critique.trim()})\n`);

  const refinePrompt = `
This was the draft:
"${draft}"

This problem was found: "${critique}"

Fix that specific problem and provide an improved version. Reply with
only the new draft, no explanation.
`;

  return await callLLM(refinePrompt);
}

/**
 * The main pipeline: gather GitHub activity + optional manual notes +
 * optional voice examples, assemble them into a prompt, generate a
 * draft, then self-check/refine it.
 */
export async function generateWeeklyReport(): Promise<string> {
  console.log("Fetching GitHub activity...");
  const githubActivity = await fetchGithubActivity(7);

  const manualBullets = await collectManualBullets();

  const voiceContext = getVoiceContext();

  const activityText = formatGithubActivity(githubActivity);
  const manualText = formatManualBullets(manualBullets);

  // Build the prompt piece by piece so optional sections can be skipped
  // cleanly instead of leaving awkward empty placeholders in the text.
  const sections: string[] = [];

  sections.push(`Here is this week's GitHub activity:\n${activityText}`);

  if (manualText) {
    sections.push(`Here are some additional things the user mentioned manually:\n${manualText}`);
  }

  if (voiceContext.hasExamples) {
    sections.push(
      `Match the user's writing STYLE using these examples (copy the TONE only, ` +
        `never the CONTENT — the content must come only from the data above):\n\n${voiceContext.text}`
    );
  }

  const instruction = voiceContext.hasExamples
    ? "Using the data above, and matching the user's writing style, write a weekly dev-update summary from the perspective of one developer. Use first-person singular language (I, my, me) throughout. Never refer to a team, company, or group as the author, and never use we or the team. Write 100-150 words, formatted like a professional post."
    : "Using the data above, write a clean, professional weekly dev-update summary from the perspective of one developer. Use first-person singular language (I, my, me) throughout. Never refer to a team, company, or group as the author, and never use we or the team. Write 100-150 words.";

  sections.push(instruction);

  const finalPrompt = sections.join("\n\n---\n\n");

  console.log("\nGenerating summary...\n");
  const draft = await callLLM(finalPrompt);

  const finalReport = await reflectAndRefine(draft, voiceContext.hasExamples);

  return finalReport;
}