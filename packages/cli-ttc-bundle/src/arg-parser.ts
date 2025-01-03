import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliArgSource, OptimizationLevel } from "@ot-builder/cli-shared";

import { getPackageVersion } from "./package-version";

export class ArgParser implements CliArgSource {
    public inputs: string[] = [];
    public output?: string;
    public unify = false;
    public sparse = false;
    public displayVersion = false;
    public displayHelp = false;
    public verbose = false;

    public optimizationLevel = OptimizationLevel.None;
    public recalcOs2XAvgCharWidth = false; // Never re-calculate this

    private acceptArgs = true;
    private argName: null | string = null;

    public arg(x: string) {
        if (x[0] === "-" && this.acceptArgs) {
            this.handleOption(x);
        } else {
            this.handleArgument(x);
        }
    }

    private handleOption(x: string) {
        switch (x) {
            case "--":
                this.acceptArgs = false;
                return;
            case "-h":
            case "--help":
                this.displayHelp = true;
                return;
            case "-v":
            case "--version":
                this.displayVersion = true;
                return;
            case "-u":
            case "--unify":
                this.unify = true;
                return;
            case "-x":
            case "--sparse":
                this.sparse = true;
                return;
            case "--verbose":
                this.verbose = true;
                return;
            case "-o":
                this.argName = x;
                return;
            case `--optimize-speed`:
            case `-Op`:
                this.optimizationLevel = OptimizationLevel.Speed;
                return;
            case `--optimize-size`:
            case `-Oz`:
                this.optimizationLevel = OptimizationLevel.Size;
                return;
            default:
                throw new Error("Unrecognized option " + x);
        }
    }

    private handleArgument(x: string) {
        if (this.argName) {
            if (this.argName === "-o") this.output = x;
            this.argName = null;
        } else {
            this.inputs.push(x);
        }
    }
}

export async function displayHelp() {
    new CliHelpShower()
        .message(`otb-ttc-bundle: TTC bundler, version ${await getPackageVersion()}`)
        .message(Style.Rule)
        .message(`Usage:`)
        .withIndent(Style.Bullet, s => {
            s.message(
                Style.Cmd`otb-ttc-bundle`,
                Style.Option`-h`,
                ";",
                Style.Cmd`otb-ttc-bundle`,
                Style.Option`--help`
            )
                .indent("")
                .message("Display help message");
        })
        .withIndent(Style.Bullet, s => {
            s.message(
                Style.Cmd`otb-ttc-bundle`,
                Style.Option`-v`,
                ";",
                Style.Cmd`otb-ttc-bundle`,
                Style.Option`--version`
            )
                .indent("")
                .message("Display version of this utility.");
        })
        .withIndent(Style.Bullet, s => {
            s.hangingIndent("  ").message(
                Style.Cmd`otb-ttc-bundle`,
                ...Style.OptRun(`options`),
                ...Style.OptRun(Style.Option`-o`, Style.Param`output`),
                ...[Style.Param`input_1`, `...`, Style.Param`input_n`]
            );
            s.indent("").message(`Bundles multiple TTF into one TTC with glyph sharing.`);
            s.withIndent(Style.Bullet, s => {
                s.message(Style.Option`-o`, Style.Param`output`)
                    .indent(``)
                    .message(`Set output file path.`);
                s.message(Style.Param`input_1`, `...`, Style.Param`input_n`)
                    .indent(``)
                    .message(`Input files, could be either TTF, OTF or TTC.`);
            });
            s.indent("").message(``).message(`Options:`);
            s.withIndent(Style.Bullet, s => {
                s.message(Style.Option`--verbose`)
                    .indent(``)
                    .message(`Set to verbose mode.`);
                s.message(Style.Option`-u`, `;`, Style.Option`--unify`)
                    .indent(``)
                    .message(`Unify glyph set.`);
                s.message(Style.Option`-x`, `;`, Style.Option`--sparse`)
                    .indent(``)
                    .message(`Enable sparse glyph sharing (TrueType outline only).`);
                s.message(Style.Option`-Op`, `;`, Style.Option`--optimize-speed`)
                    .indent(``)
                    .message(`Optimize the output data arrangement for faster layout.`);
                s.message(Style.Option`-Oz`, `;`, Style.Option`--optimize-size`)
                    .indent(``)
                    .message(`Optimize the output data arrangement for smaller file size.`);
            });
        });
}

export async function displayVersion() {
    console.log(await getPackageVersion());
}
