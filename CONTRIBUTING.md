# Contributing Guide

## Pull Request Guidelines

- Never push anything to `ot-builder` repository directly.
- Create your fork and make pull requests.
- Make sure `npm test` passes. We have automation to ensure all the tests passes.
- Make sure you have change files included. Create them with `npm run change`.
- If you are implementing a new feature (like supporting a new table), add unit tests.

## Development Environment Setup

* Make sure that you have a GitHub account.
* Install [Node.JS LTS 12](https://nodejs.org/en/) or newer.
* Install [Git](https://git-scm.com/).
* For code editing we like Visual Studio Code.
  * The following plugins are recommended:
    * [AutoLaunch](https://marketplace.visualstudio.com/items?itemName=philfontaine.autolaunch)
    * [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
    * [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    * [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
    * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Verify Your Environment Works

* Run `node -v` to check your Node.JS version. It should be `12.x.x` or newer.
* Run `npm -v` to check your NPM version. If your version is below `5.x.x`, run `npm install -g npm@5.x.x` (literal "x" characters here) to update it.
* Go to a folder and run `code .` to open the folder in VS Code. If you don't have VS Code in your path, you can open VS Code and press `F1` or `ctrl+shift+P` (`cmd+shift+P`), type `path`, and select the `Install 'code' command in PATH` option.
* Run `git --version` to make sure you have Git installed.

## Making Changes – Source

* Create a new branch to work with. Do not use `master`.

* Create an initial build:

  * `npm run init` to install the dependencies and set everything up.
  * `npm run build` to create the initial build.

* Make your changes:

  * Use `npm run watch` to start background building.
    * If you have Visual Studio Code and AutoLaunch plugin installed, it will run this at background so you could have automatic background building.
  * If you implemented a new feature (like supporting a new Table), add unit tests.
  * If you added a new package or changed the dependency, run `npm run rebuild` to create a new build.
    * Make sure that you terminated all `watch` background tasks (including Visual Studio Code session that has `npm run watch` running in background) before running it.

  * Run `npm test` to validate your change.

* Make a pull request:

  * Run `npm run change` to create change files. The change files will decide the version of next publish and create change logs automatically.
  * Run `npm run lint` to check your code style.
  * Send pull request to `ot-builder` repository.

## Project Structure

- **`.github`**: Configuration for GitHub automation.
- **`.vscode`**: Configuration for Visual Studio Code plugins.
- **`change`**: Collected change files. It will be cleared when a new version is published.
- **`doc`**: The documentations.
- **`packages`**: The source code packages.
  - Unit tests are also here, lies side-by-side with the source code. The unit tests are named in `*.test.ts` pattern and uses Jest to test them.
  - The `ft-*` packages defines the data type of OpenType structures, usually tables.
  - The `io-bin-*` packages defines the procedure of reading and writing OpenType binaries for the corresponded `ft-*` types.
  - The `test-util` package contains utility functions for writing unit tests, including functions to compare font data structures. Introduce it as a dev-dependency of the packages need it – usually font IO packages or font manipulation packages.
- **`scripts`**: The utility scripts used for building this repository.
- **`test-fonts`**: The fonts used for testing.

