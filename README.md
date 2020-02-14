# Trailblazer

---

![](https://gitlab.com/winterwildfire/ue4/trailblazer/badges/master/pipeline.svg)
![](https://img.shields.io/badge/4.24-fully%20supported-green)
![](https://img.shields.io/discord/573495259926102017)

Trailblazer is a VSCode extension for Unreal Engine 4 devs that provides powerful code-completion and command line features for programmers and asset management/optimization tools for designers.

This extension shows how to leverage the extension terminal API proposed in v1.37 that enables an extension to handle a terminal's input and emit output.

## VS Code API

### `vscode` module

- [window.createTerminal](https://code.visualstudio.com/api/references/vscode-api#window.createTerminal)

### Proposed API

- `window.Pseudoterminal`
- `window.ExtensionTerminalOptions`

### Contribution Points

- [`contributes.commands`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)

## Running the Sample

- Run `npm install` in terminal to install dependencies
- Run the `Run Extension` target in the Debug View. This will: - Start a task `npm: watch` to compile the code - Run the extension in a new VS Code window

check check
