// LICENSE : MIT
'use strict';
import { isTxtAST } from '@textlint/ast-tester';
import { parse } from '../src/review-to-ast';
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
});
