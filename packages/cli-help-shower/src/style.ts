import * as Chalk from "chalk";

const terminalSupportsUnicode =
    process.platform !== "win32" ||
    process.env.TERM_PROGRAM === "vscode" ||
    !!process.env.WT_SESSION; // Workaround https://github.com/microsoft/terminal/issues/1040

export const CONSOLE_WIDTH = 80;
export const Bullet = terminalSupportsUnicode ? `· ` : `+ `;
export const Rule = (terminalSupportsUnicode ? `─` : `-`).repeat(CONSOLE_WIDTH);

export const Cmd = Chalk.cyan;
export const Option = Chalk.green;
export const Param = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    `<` + Chalk.yellow(s, ...placeholders) + `>`;
export const Arg = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    Chalk.yellow(s, ...placeholders);

export function OptRun(...xs: string[]) {
    return ["[", ...xs, "]"];
}

export function AltRun(...xs: string[]) {
    const a: string[] = [];
    for (let index = 0; index < xs.length; index++) {
        if (index) a.push("|");
        a.push(xs[index]);
    }
    return a;
}
