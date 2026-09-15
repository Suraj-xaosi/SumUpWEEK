import * as fs from "node:fs/promises";
import clipboardy from "clipboardy";
import { generateWeeklyReport } from "./GenerateReport.js";
import { appendReportToHistory } from "./ReportHistory.js";

async function main() {
  console.log("=== Weekly Dev Report Generator ===\n");

  try {
    const report = await generateWeeklyReport();

    console.log("\n=== Your Weekly Report ===\n");
    console.log(report);
    console.log("\n===========================\n");

    await appendReportToHistory(report);
    console.log("Added to reportHistory.md");

    const filename = `report-${new Date().toISOString().split("T")[0]}.txt`;
    await fs.writeFile(filename, report, "utf-8");
    console.log(`Saved to: ${filename}`);

    await clipboardy.write(report);
    console.log("Copied to your clipboard — go ahead and paste it wherever you need it.");
  } catch (err) {
    // Top-level safety net: if anything unrecoverable happens anywhere in
    // the pipeline (bad API key, network failure, etc), fail loudly with
    // a clear message instead of letting a confusing raw stack trace
    // (or a silent hang) be the only thing the user sees.
    console.error("\nSomething went wrong:");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();