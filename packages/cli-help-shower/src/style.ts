import * as pc from "picocolors";

const terminalSupportsUnicode =
    process.platform !== "win32" ||
    process.env.TERM_PROGRAM === "vscode" ||
    !!process.env.WT_SESSION; // Workaround https://github.com/microsoft/terminal/issues/1040

export const CONSOLE_WIDTH = 80;
export const Bullet = terminalSupportsUnicode ? `· ` : `+ `;
export const Rule = (terminalSupportsUnicode ? `─` : `-`).repeat(CONSOLE_WIDTH);

export const Cmd = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    pc.cyan(simpleTemplateCombine(s, placeholders));
export const Option = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    pc.green(simpleTemplateCombine(s, placeholders));
export const Arg = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    pc.yellow(simpleTemplateCombine(s, placeholders));
export const Param = (s: TemplateStringsArray, ...placeholders: unknown[]) =>
    `<` + pc.yellow(simpleTemplateCombine(s, placeholders)) + `>`;

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

export function ArgvParseError(s: string) {
    return pc.bold(pc.red(pc.underline(s)));
}

function simpleTemplateCombine(s: TemplateStringsArray, placeholders: unknown[]) {
    let res = s[0];

    for (let i = 0; i < placeholders.length; i++) {
        res += String(placeholders[i]) + (s[i + 1] || "");
    }

    return res;
}
