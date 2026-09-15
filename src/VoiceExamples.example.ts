// ─────────────────────────────────────────────────────────────────
// THIS FILE IS COMPLETELY OPTIONAL.
//
// If you want your weekly summary to sound like YOU (your tone, your
// sentence style, whether you use humor, etc), copy this file to
// "voiceExamples.ts" (same folder) and paste 5-8 examples of things
// you've written before — old standup messages, LinkedIn posts,
// Slack updates, anything in your own voice.
//
// If you skip this step entirely, the tool still works fine — it will
// just generate a neutral, professional-sounding summary instead of a
// personalized one.
// ─────────────────────────────────────────────────────────────────

export const VOICE_EXAMPLES: string[] = [
  // Paste your own past posts/updates here, for example:
  // "This week I dug into a nasty session bug that only showed up on
  //  mobile — took two days to track down, turned out to be a race
  //  condition in a parallel request. Classic.",
];

/**
 * Returns the voice examples as a single block of text, plus a flag
 * telling the rest of the app whether personalization is available.
 * Downstream code should treat `hasExamples: false` as a normal,
 * expected case — not an error.
 */
export function getVoiceContext(): { text: string; hasExamples: boolean } {
  if (VOICE_EXAMPLES.length === 0) {
    return { text: "", hasExamples: false };
  }

  const text = VOICE_EXAMPLES.map((example, i) => `Example ${i + 1}:\n${example.trim()}`).join(
    "\n\n"
  );

  return { text, hasExamples: true };
}