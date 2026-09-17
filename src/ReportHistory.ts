import * as fs from "node:fs/promises";
import * as path from "node:path";
import { formatReport } from "./GenerateReport.js";

const historyFilePath = path.join(process.cwd(), "reportHistory.md");
const historyTitle = "# Weekly Report History\n\n";

async function ensureHistoryFile(): Promise<void> {
  try {
    const stats = await fs.stat(historyFilePath);

    if (stats.size === 0) {
      await fs.writeFile(historyFilePath, historyTitle, "utf-8");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await fs.writeFile(historyFilePath, historyTitle, "utf-8");
  }
}

export async function appendReportToHistory(report: string): Promise<void> {
  await ensureHistoryFile();

  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
  const cleanReport = formatReport(report);
  const historyEntry = `## ${timestamp}\n\n${cleanReport}\n\n---\n\n`;
  const history = await fs.readFile(historyFilePath, "utf-8");

  if (history.startsWith(historyTitle)) {
    await fs.writeFile(historyFilePath, `${historyTitle}${historyEntry}${history.slice(historyTitle.length)}`, "utf-8");
    return;
  }

  await fs.writeFile(historyFilePath, `${historyTitle}${historyEntry}${history}`, "utf-8");
}