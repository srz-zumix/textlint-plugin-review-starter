# textlint-plugin-review-starter

[![Build Status](https://travis-ci.org/srz-zumix/textlint-plugin-review-starter.svg?branch=main)](https://travis-ci.org/srz-zumix/textlint-plugin-review-starter) [![npm version](https://badge.fury.io/js/textlint-plugin-review-starter.svg)](https://badge.fury.io/js/textlint-plugin-review-starter)

Add [Re:VIEW Starter](hhttps://kauplan.org/reviewstarter/) support for [textlint](https://github.com/textlint/textlint "textlint").

forked from [textlint-plugin-review](https://github.com/orangain/textlint-plugin-review)

What is textlint plugin? Please see https://github.com/textlint/textlint/blob/master/docs/plugin.md

## Installation

    npm install textlint-plugin-review-starter

## Usage

Manually add review plugin to your `.textlintrc` like:

```json
{
    "plugins": [
        "review-starter"
    ]
}
```

Lint Re:VIEW Starter file with textlint:

```
$ textlint ch01.re
```

## Re:VIEW Starter Extensions

* Inline command
  * fence `$|`
  * Nested inline command
  * B
  * weak
  * small,xsmall,xxsmall
  * large,xlarge,xxlarge
  * userinput
  * cursor
  * secref
  * file
  * hlink
  * LaTex,Tex,hearts
* Block command
  * abstract
  * terminal
  * sideimage

## Tests

    npm test

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT

If you distribute textlint-plugin-review-starter, you might enjoy the [LICENSE-MIXING](LICENSE-MIXING) document.
