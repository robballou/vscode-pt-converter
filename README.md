# vscode-pt-converter README

This VSCode extension allows for easy use of [PropType Converter](https://github.com/robballou/proptype-converter) for converting PropTypes to TypeScript types.

## Features

1. Provides a refactor option for JS/TS files to convert PropType implementations to TypeScript Types.
1. Also provides a general convert command which will convert all the components in a file.

## Known Issues

The [PropType Converter library](https://github.com/robballou/proptype-converter) is purposefully limited in what it can convert. You can make recommendations
for common PropTypes to support there. Also it will convert PropTypes it does not understand to `unknown` so you can type it correctly!
