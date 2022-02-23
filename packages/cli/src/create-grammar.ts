import { CliAction, Grammar } from "./command";
import { CliState } from "./state";
import { ConsolidateSyntax } from "./syntax/actions/consolidate";
import { DropSyntax } from "./syntax/actions/drop";
import { GcSyntax } from "./syntax/actions/gc";
import { IntroSyntax } from "./syntax/actions/intro";
import { MergeSyntax } from "./syntax/actions/merge";
import { RebaseSyntax } from "./syntax/actions/rebase";
import { SaveSyntax } from "./syntax/actions/save";
import { SaveHeadSyntax } from "./syntax/actions/save-head";
import { SubsetSyntax } from "./syntax/actions/subset";
import { TransformGlyphsSyntax } from "./syntax/actions/transform-glyphs";
import { AlternateSyntax } from "./syntax/composite/alternate";
import { MainCommandSyntax } from "./syntax/composite/main-command";
import { Join, PossessiveRepeatSyntax } from "./syntax/composite/possessive-repeat";
import { StartSyntax } from "./syntax/composite/start";
import { HelpSyntax } from "./syntax/document/help";
import { VersionSyntax } from "./syntax/document/version";
import { SetOptimizationLevelSyntax } from "./syntax/options/set-optimize-level";
import { SetRecalcOs2AvgCharWidthSyntax } from "./syntax/options/set-recalc-os2-avg-char-width";

const cliActionJoiner: Join<CliAction> = {
    join(actions: CliAction[]): CliAction {
        return async function (state: CliState) {
            for (const action of actions) await action(state);
        };
    }
};

// Grammar Creator
export function createGrammar(): Grammar {
    const element = new AlternateSyntax([
        IntroSyntax,
        SaveSyntax,
        SaveHeadSyntax,

        RebaseSyntax,
        TransformGlyphsSyntax,

        MergeSyntax,
        SubsetSyntax,

        DropSyntax,
        GcSyntax,
        ConsolidateSyntax,

        SetOptimizationLevelSyntax,
        SetRecalcOs2AvgCharWidthSyntax
    ]);
    const start = new StartSyntax(
        new AlternateSyntax([
            HelpSyntax,
            VersionSyntax,
            new MainCommandSyntax(new PossessiveRepeatSyntax(cliActionJoiner, element))
        ])
    );

    return { element, start };
}
