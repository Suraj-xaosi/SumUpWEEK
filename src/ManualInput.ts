import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { terminalColors as colors } from "./TerminalColors.js";

export async function collectDaysBack(): Promise<number> {
  const rl = readline.createInterface({ input, output });

  while (true) {
    const answer = await rl.question(
      colors.info("How many past days should I summarize? (1-10, default 7): ")
    );
    const trimmedAnswer = answer.trim();

    if (trimmedAnswer === "") {
      rl.close();
      return 7;
    }

    const daysBack = Number(trimmedAnswer);
    if (Number.isInteger(daysBack) && daysBack >= 1 && daysBack <= 10) {
      rl.close();
      return daysBack;
    }

    console.log(colors.warning("Please enter a whole number from 1 to 10, or press Enter for 7."));
  }
}

/**
 * Asks the user, in the terminal, whether they want to add anything that
 * isn't tracked on GitHub (meetings, discussions, helping a teammate, etc).
 * This is entirely optional — if the user says no, an empty array is
 * returned immediately and no further prompts appear.
 */
export async function collectManualBullets(): Promise<string[]> {
  const rl = readline.createInterface({ input, output });

  const wantsToAdd = await rl.question(
    colors.info("\nWould you like to add anything besides your GitHub activity? (y/n): ")
  );

  if (wantsToAdd.trim().toLowerCase() !== "y") {
    rl.close();
    return [];
  }

  console.log(colors.muted("\nOne line = one bullet point. Press Enter on an empty line when done.\n"));

  const bullets: string[] = [];

  while (true) {
    const line = await rl.question(colors.bullet("> "));

    if (line.trim() === "") {
      break;
    }

    bullets.push(line.trim());
  }

  rl.close(); // Always close the readline interface, or the process will hang

  return bullets;
}