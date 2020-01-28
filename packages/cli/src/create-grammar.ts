import { Grammar } from "./command";
import { AlternateSyntax } from "./syntax/alternate";
import { gcFont, GcSyntax } from "./syntax/gc";
import { IntroSyntax, loadFontFromFile } from "./syntax/intro";
import { PossessiveRepeatSyntax } from "./syntax/possessive-repeat";
import { rebaseFont, RebaseSyntax } from "./syntax/rebase";
import { saveFontToFile, SaveSyntax } from "./syntax/save";

// Grammar Creator
export function createGrammar(): Grammar {
    const element = new AlternateSyntax([IntroSyntax, SaveSyntax, RebaseSyntax, GcSyntax]);
    const start = new PossessiveRepeatSyntax(element);

    return { element, start };
}

// CLI procedures re-export
export const CliProc = {
    loadFontFromFile,
    saveFontToFile,
    rebaseFont,
    gcFont
};
