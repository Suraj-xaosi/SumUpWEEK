import * as fs from "node:fs/promises";
import clipboardy from "clipboardy";
import { generateWeeklyReport } from "./GenerateReport.js";
import { appendReportToHistory } from "./ReportHistory.js";
import { formatReportForTerminal, terminalColors as colors } from "./TerminalColors.js";

async function main() {
  console.log(colors.title(`
========================================
              SUM UP WEEK
========================================
`));

  try {
    const report = await generateWeeklyReport();

    console.log(colors.heading("\n=== Your Weekly Report ===\n"));
    console.log(formatReportForTerminal(report));
    console.log(colors.heading("\n===========================\n"));

    await appendReportToHistory(report);
    console.log(colors.success("Added to reportHistory.md"));

    const filename = `report-${new Date().toISOString().split("T")[0]}.txt`;
    await fs.writeFile(filename, report, "utf-8");
    console.log(colors.success(`Saved to: ${filename}`));

    await clipboardy.write(report);
    console.log(colors.success("Copied to your clipboard — go ahead and paste it wherever you need it."));
  } catch (err) {
    // Top-level safety net: if anything unrecoverable happens anywhere in
    // the pipeline (bad API key, network failure, etc), fail loudly with
    // a clear message instead of letting a confusing raw stack trace
    // (or a silent hang) be the only thing the user sees.
    console.error(colors.error("\nSomething went wrong:"));
    console.error(colors.error(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
}

main();