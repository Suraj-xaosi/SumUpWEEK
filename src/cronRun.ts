import { execSync } from "node:child_process";
import { generateWeeklyReport } from "./GenerateReport.js";
import { appendReportToHistory } from "./ReportHistory.js";

function runGitCommand(command: string): void {
  execSync(command, { stdio: "inherit" });
}

async function main(): Promise<void> {
  try {
    const report = await generateWeeklyReport();
    await appendReportToHistory(report);

    const dateStr = new Date().toISOString().split("T")[0];
    runGitCommand("git add reportHistory.md");

    try {
      runGitCommand(`git commit -m "Weekly report: ${dateStr}"`);
    } catch {
      console.log("Nothing new to commit, skipping.");
    }

    runGitCommand("git push");
    console.log("Cron run complete - pushed to GitHub.");
  } catch (error) {
    console.error(
      "Cron run failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  }
}

main();
