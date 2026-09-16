const useColors = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;

function color(code: string, text: string): string {
  return useColors ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export const terminalColors = {
  title: (text: string) => color("96;1", text),
  heading: (text: string) => color("95;1", text),
  section: (text: string) => color("94;1", text),
  body: (text: string) => color("97", text),
  bullet: (text: string) => color("93", text),
  info: (text: string) => color("36", text),
  success: (text: string) => color("32", text),
  warning: (text: string) => color("33", text),
  error: (text: string) => color("31;1", text),
  muted: (text: string) => color("90", text),
};

export function formatReportForTerminal(report: string): string {
  return report
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) {
        return terminalColors.section(line);
      }

      if (line.startsWith("- ")) {
        return terminalColors.bullet(line);
      }

      return line.trim() === "" ? line : terminalColors.body(line);
    })
    .join("\n");
}