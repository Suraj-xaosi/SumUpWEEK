import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Asks the user, in the terminal, whether they want to add anything that
 * isn't tracked on GitHub (meetings, discussions, helping a teammate, etc).
 * This is entirely optional — if the user says no, an empty array is
 * returned immediately and no further prompts appear.
 */
export async function collectManualBullets(): Promise<string[]> {
  const rl = readline.createInterface({ input, output });

  const wantsToAdd = await rl.question(
    "\nWould you like to add anything besides your GitHub activity? (y/n): "
  );

  if (wantsToAdd.trim().toLowerCase() !== "y") {
    rl.close();
    return [];
  }

  console.log("\nOne line = one bullet point. Press Enter on an empty line when done.\n");

  const bullets: string[] = [];

  while (true) {
    const line = await rl.question("> ");

    if (line.trim() === "") {
      break;
    }

    bullets.push(line.trim());
  }

  rl.close(); // Always close the readline interface, or the process will hang

  return bullets;
}