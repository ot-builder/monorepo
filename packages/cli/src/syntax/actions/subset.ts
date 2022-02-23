import * as Fs from "fs";

import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliProc, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";
import * as ParseUnicodeRanges from "../../sub-parsers/unicode-ranges/generated";

export const SubsetSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--subset")) return ParseResult(st, null);
        st = st.next();

        let parser: CharSubsetParser, argument: string;

        if (st.isOption("--file", "--unicodes", "--unicodes-file")) {
            switch (st.option) {
                case "--file":
                    parser = new FileParser(new PlainTextParser());
                    break;
                case "--unicodes":
                    parser = new UnicodeRangesParser();
                    break;
                case "--unicodes-file":
                    parser = new FileParser(new UnicodeRangesParser());
                    break;
                default:
                    throw new Error("Unreachable");
            }
            st = st.next();
            argument = st.expectArgument();
        } else {
            parser = new PlainTextParser();
            argument = st.expectArgument();
        }

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to subset.");
            console.log(`Subset ${entry}`);

            const gcBefore = entry.font.glyphs.decideOrder().length;
            CliProc.subsetFont(entry.font, await parser.parse(argument), Ot.ListGlyphStoreFactory);
            const gcAfter = entry.font.glyphs.decideOrder().length;

            state.push(entry);
            console.log(`  Glyphs: ${gcAfter} / ${gcBefore}`);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`--subset`, Style.Param`text`);
        shower
            .indent("")
            .message(Style.Option`--subset`, Style.Option`--file`, Style.Param`path`)
            .message(Style.Option`--subset`, Style.Option`--unicodes`, Style.Param`codes`)
            .message(Style.Option`--subset`, Style.Option`--unicodes-file`, Style.Param`path`);
        shower
            .indent("")
            .message(
                "Subset the font at the stack top according to the text or unicode ranges given."
            )
            .message(
                ...["Option", Style.Option`--unicodes`, "is specified by a comma/semicolon"],
                ...["separated list of hex values or ranges (using", Style.Arg`..`, "operator),"],
                ...["optionally prefixed with", Style.Arg`U+`, "or", Style.Arg`0x`, "."],
                ...["Prefixing a range with operator", Style.Arg`-`, "indicates exclusion, and"],
                ...["will exclude the specified range from the character set to be kept."],
                ...["For example, the following parameter:"]
            );
        shower
            .indent("    ")
            .message(Style.Option`--unicodes`, Style.Arg`'00..7F,-30..39,2000..206F'`);
        shower
            .indent("")
            .message(
                "Will subset the font with Basic ASCII and General Punctuation block,",
                "but without number digits."
            );
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Character subset parsers

interface CharSubsetParser {
    parse(argument: string): Promise<Iterable<string>>;
}

class PlainTextParser implements CharSubsetParser {
    public async parse(argument: string) {
        return argument;
    }
}

class UnicodeRangesParser implements CharSubsetParser {
    public async parse(argument: string) {
        const setChars = new Set<string>();
        const pr = ParseUnicodeRanges.parse(argument);
        if (pr.errs.length || !pr.ast)
            throw new Error("Unable to parse unicode ranges: " + pr.errs[0].toString());

        for (const rg of pr.ast.ranges) {
            if (rg.isExclusion) {
                for (let ch = rg.start; ch <= rg.end; ch++) {
                    setChars.delete(String.fromCodePoint(ch));
                }
            } else {
                for (let ch = rg.start; ch <= rg.end; ch++) {
                    setChars.add(String.fromCodePoint(ch));
                }
            }
        }

        return setChars;
    }
}

class FileParser implements CharSubsetParser {
    constructor(private readonly subParser: CharSubsetParser) {}
    public async parse(path: string) {
        const body = await Fs.promises.readFile(path, "utf-8");
        return this.subParser.parse(body);
    }
}
