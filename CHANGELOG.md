# Change Log

All notable changes to the "vscode-pt-converter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [v1.4.0]

- Upgrade to proptype-converter v1.10.0, allowing preservation of JSDoc comments associated with PropTypes.

## [v1.3.0]

- Upgrade to proptype-converter v1.9.0, allowing preservation of props that were only in the component's arguments (and not in the prop types)
- Adds two new settings for use:
	- `vscode-pt-converter.alwaysRenameToTSX`: Always rename files to `.tsx` instead of matching the file's current name.
	- `vscode-pt-converter.includeUnknownFunctionArgumentProps`: Preserve props that were only in the component's arguments while creating the new props argument.

## [v1.2.1]

- Upgrade to proptype-converter v1.8.0 to fix some indent issues and add support for `instanceOf` PropTypes.

## [v1.2.0]

- Upgrade to proptype-converter v1.7.0, which allows support for processing the "props" parameter of the component function even when no `defaultProps` are used.
- Refactored to tidy up a bit.

## [v1.1.0]

- Upgrade to proptype-converter v1.6.1 allowing support for arrow function/function expression components

## [v1.0.0]

- Full release!
- Added support for `defaultProps`
