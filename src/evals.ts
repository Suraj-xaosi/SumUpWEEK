import { formatGithubActivity, formatManualBullets, formatReport } from "./GenerateReport.js";
import { fetchGithubActivity } from "./FetchGithubActivity.js";

interface EvalCase {
  name: string;
  run: () => Promise<boolean>; // true = pass, false = fail
}

const evalCases: EvalCase[] = [
  {
    name: "formatManualBullets returns an empty string for an empty array",
    run: async () => formatManualBullets([]) === "",
  },
  {
    name: "formatGithubActivity shows a fallback message for an empty array",
    run: async () => formatGithubActivity([]).includes("no GitHub activity"),
  },
  {
    name: "formatGithubActivity formats a non-empty array as a bullet list",
    run: async () => {
      const result = formatGithubActivity([
        { type: "commit", title: "Fix bug", url: "http://x", date: "2026-01-01" },
      ]);
      return result.includes("- [commit] Fix bug");
    },
  },
  {
    name: "formatReport separates a single-line report into readable paragraphs",
    run: async () => formatReport("First sentence. Second sentence. Third sentence.").includes("\n\n"),
  },
  {
    name: "fetchGithubActivity never throws, even if the network/API call fails",
    run: async () => {
      try {
        await fetchGithubActivity(7);
        return true; // Whatever it returns, as long as it didn't throw
      } catch {
        return false;
      }
    },
  },
];

async function runEvals() {
  console.log("=== Running Eval Suite ===\n");
  let passed = 0;

  for (const evalCase of evalCases) {
    try {
      const result = await evalCase.run();
      console.log(`${result ? "PASS" : "FAIL"} — ${evalCase.name}`);
      if (result) passed++;
    } catch (err) {
      console.log(`FAIL (crashed) — ${evalCase.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nScore: ${passed}/${evalCases.length}`);
}

runEvals();