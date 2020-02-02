import * as Chalk from "chalk";

const terminalSupportsUnicode =
    process.platform !== "win32" ||
    process.env.TERM_PROGRAM === "vscode" ||
    !!process.env.WT_SESSION; // Workaround https://github.com/microsoft/terminal/issues/1040

const AnsiPattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
].join("|");

export const AnsiRegex = new RegExp(AnsiPattern, "g");

export const CONSOLE_WIDTH = 80;
export const Bullet = terminalSupportsUnicode ? `· ` : `+ `;
export const CliRule = (terminalSupportsUnicode ? `─` : `-`).repeat(CONSOLE_WIDTH);

export const CliCmdStyle = Chalk.cyan;
export const CliOptionStyle = Chalk.green;
export const CliParamStyle = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    `<` + Chalk.yellow(s, ...placeholders) + `>`;
export const CliArgStyle = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    Chalk.yellow(s, ...placeholders);
