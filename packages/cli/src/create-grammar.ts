import { Grammar } from "./command";
import { gcFont, GcSyntax } from "./syntax/actions/gc";
import { IntroSyntax, loadFontFromFile } from "./syntax/actions/intro";
import { mergeFonts, MergeSyntax } from "./syntax/actions/merge";
import { rebaseFont, RebaseSyntax } from "./syntax/actions/rebase";
import { saveFontToFile, SaveSyntax } from "./syntax/actions/save";
import { subsetFont, SubsetSyntax } from "./syntax/actions/subset";
import { AlternateSyntax } from "./syntax/composite/alternate";
import { PossessiveRepeatSyntax } from "./syntax/composite/possessive-repeat";
import { StartSyntax } from "./syntax/composite/start";
import { HelpSyntax } from "./syntax/document/help";
import { MainCommandSyntax } from "./syntax/composite/main-command";

// Grammar Creator
export function createGrammar(): Grammar {
    const element = new AlternateSyntax([
        IntroSyntax,
        SaveSyntax,
        RebaseSyntax,
        GcSyntax,
        SubsetSyntax,
        MergeSyntax
    ]);
    const start = new StartSyntax(
        new AlternateSyntax([
            HelpSyntax,
            new MainCommandSyntax(new PossessiveRepeatSyntax(element))
        ])
    );

    return { element, start };
}

// CLI procedures re-export
export const CliProc = {
    loadFontFromFile,
    saveFontToFile,
    rebaseFont,
    gcFont,
    subsetFont,
    mergeFonts
};
