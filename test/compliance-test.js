// LICENSE : MIT
'use strict';
import { isTxtAST } from '@textlint/ast-tester';
import { parse } from '../src/review-to-ast';
import { supportedInlineCommands } from '../src/inline-parsers';
import assert from 'power-assert';
import fs from 'fs';
import path from 'path';

describe('compliance', function () {
  context('when use fixture', function () {
    it('should pass compliance test', function () {
      var fixturePath = path.join(__dirname, 'fixtures/test.re');
      var content = fs.readFileSync(fixturePath, 'utf-8');
      var AST = parse(content);
      assert(isTxtAST(AST));
    });
  });

  context('commands list', function() {
    it('should include InlineParsers', function() {
      var fixturePath = path.join(__dirname, 'fixtures/inline-commands.txt');
      var content = fs.readFileSync(fixturePath, 'utf-8');
      var lines = content.split("\n");
      const inlineCommands = supportedInlineCommands();
      for ( var i=0; i<lines.length; i++ ) {
        var command = lines[i].trim();
        if( command ) {
          assert(inlineCommands.includes(command))
        }
      }
      for ( var i=0; i<inlineCommands.length; i++ ) {
        var command = inlineCommands[i].trim();
        if( command ) {
          assert(lines.includes(command))
        }
      }
    });
  });
});
