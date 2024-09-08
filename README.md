# vscode-pt-converter README

This VSCode extension allows for easy use of [PropType Converter](https://github.com/robballou/proptype-converter) for converting PropTypes to TypeScript types.

## Features

1. Provides a refactor option for JS/TS files to convert PropType implementations to TypeScript Types.
1. Includes the ability to refactor `defaultProps` to a destructured parameter with default values.
1. Also provides two general convert commands which will convert all the components in a file as well as specific code actions.

## Usage

While editing a React component, you can either use the "Refactor..." command/menu item, the code actions shortcut, or the "Convert PropTypes..." commands.

The refactor/code actions options will only show up if PropTypes are detected. Additionally, they will rename the file to its appropriate TS file extension.

## Known Issues

The [PropType Converter library](https://github.com/robballou/proptype-converter) is purposefully limited in what it can convert. You can make recommendations
for common PropTypes to support there. Also it will convert PropTypes it does not understand to `unknown` so you can type it correctly!
