import { Grammar } from "./command";
import { GcSyntax } from "./syntax/actions/gc";
import { IntroSyntax } from "./syntax/actions/intro";
import * as MergeLib from "./syntax/actions/merge";
import { RebaseSyntax } from "./syntax/actions/rebase";
import { SaveSyntax } from "./syntax/actions/save";
import { SaveHeadSyntax } from "./syntax/actions/save-head";
import { ShareGlyphSetSyntax } from "./syntax/actions/share-glyph-set";
import { SubsetSyntax } from "./syntax/actions/subset";
import { AlternateSyntax } from "./syntax/composite/alternate";
import { MainCommandSyntax } from "./syntax/composite/main-command";
import { PossessiveRepeatSyntax } from "./syntax/composite/possessive-repeat";
import { StartSyntax } from "./syntax/composite/start";
import { HelpSyntax } from "./syntax/document/help";
import { VersionSyntax } from "./syntax/document/version";

// Grammar Creator
export function createGrammar(): Grammar {
    const element = new AlternateSyntax([
        IntroSyntax,
        SaveSyntax,
        SaveHeadSyntax,
        RebaseSyntax,
        GcSyntax,
        SubsetSyntax,
        MergeLib.MergeSyntax,
        ShareGlyphSetSyntax
    ]);
    const start = new StartSyntax(
        new AlternateSyntax([
            HelpSyntax,
            VersionSyntax,
            new MainCommandSyntax(new PossessiveRepeatSyntax(element))
        ])
    );

    return { element, start };
}
