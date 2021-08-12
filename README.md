# textlint-plugin-review-starter

[![Build Status](https://github.com/srz-zumix/textlint-plugin-review-starter/workflows/Test/badge.svg?branch=main&event=push)](https://github.com/srz-zumix/textlint-plugin-review-starter/actions?query=workflow%3ATest+event%3Apush)
[![npm version](https://badge.fury.io/js/textlint-plugin-review-starter.svg)](https://badge.fury.io/js/textlint-plugin-review-starter)

Add [Re:VIEW Starter](https://kauplan.org/reviewstarter/) support for [textlint](https://github.com/textlint/textlint "textlint").

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
  * W
  * weak
  * small,xsmall,xxsmall
  * large,xlarge,xxlarge
  * userinput
  * cursor
  * secref
  * term
  * termnoidx
  * par
  * qq
  * file
  * hlink
  * LaTex,Tex,hearts
* Block command
  * abstract
  * chapterauthor
  * output
  * program
  * sideimage
  * terminal

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

If you distribute textlint-plugin-review-starter, you might enjoy the [LICENSE-MIXING](docs/LICENSE-MIXING) document.
