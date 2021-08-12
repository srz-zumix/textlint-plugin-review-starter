// LICENSE : MIT
'use strict';
import assert from 'assert';
import { Syntax } from './mapping';
import {
  parseBlockArg, findInlineTag, createNodeFromChunk, createCommentNodeFromLine, createStrNode,
  createInlineNode, contextFromLine, offsetContext, contextNeedsUnescapeBraces, unescapeValue
} from './parser-utils';

/**
 * parse a line.
 * @param {Line} line - line to parse
 * @return {[TxtNode]} TxtNodes
 */
export function parseLine(line) {
  if (line.isComment) {
    return [createCommentNodeFromLine(line)];
  }

  return parseText(line.text, contextFromLine(line));
}

const InlineParsers = {
  // text tags
  bou:     inlineTextTagParser(Syntax.Bouten),
  ami:     inlineTextTagParser(Syntax.Amikake),
  u:       inlineTextTagParser(Syntax.Underline),
  b:       inlineTextTagParser(Syntax.Bold),
  i:       inlineTextTagParser(Syntax.Italic),
  strong:  inlineTextTagParser(Syntax.Strong),
  em:      inlineTextTagParser(Syntax.Emphasis),
  tt:      inlineTextTagParser(Syntax.Teletype),
  tti:     inlineTextTagParser(Syntax.TeletypeItalic),
  ttb:     inlineTextTagParser(Syntax.TeletypeBold),
  tcy:     inlineTextTagParser(Syntax.TateChuYoko),
  ins:     inlineTextTagParser(Syntax.Insert),
  del:     inlineTextTagParser(Syntax.Delete),
  idx:     inlineTextTagParser(Syntax.Index),
  balloon: inlineTextTagParser(Syntax.Ballon),

  // partially text tags
  kw:      parseKeywordTag,
  ruby:    parseRubyTag,
  href:    parseHrefTag,

  // non-text tags
  chap:    inlineNonTextTagParser(Syntax.Reference),
  title:   inlineNonTextTagParser(Syntax.Reference),
  chapref: inlineNonTextTagParser(Syntax.Reference),
  list:    inlineNonTextTagParser(Syntax.Reference),
  img:     inlineNonTextTagParser(Syntax.Reference),
  table:   inlineNonTextTagParser(Syntax.Reference),
  eq:      inlineNonTextTagParser(Syntax.Reference),
  hd:      inlineNonTextTagParser(Syntax.Reference),
  column:  inlineNonTextTagParser(Syntax.Reference),
  fn:      inlineNonTextTagParser(Syntax.Reference),
  w:       inlineNonTextTagParser(Syntax.Reference),
  wb:      inlineNonTextTagParser(Syntax.Reference),
  hidx:    inlineNonTextTagParser(Syntax.Hide),

  code:    withValue(inlineNonTextTagParser(Syntax.Code)),
  comment: withValue(inlineNonTextTagParser(Syntax.Comment)),
  uchar:   inlineNonTextTagParser(Syntax.UnicodeChar),
  br:      inlineNonTextTagParser(Syntax.Break),
  icon:    inlineNonTextTagParser(Syntax.Icon),
  m:       inlineNonTextTagParser(Syntax.Math),
  raw:     inlineNonTextTagParser(Syntax.Raw),
  embed:   inlineNonTextTagParser(Syntax.Raw),

  // Starter
  B:         inlineTextTagParser(Syntax.Strong),
  weak:      inlineTextTagParser(Syntax.Weak),
  small:     inlineTextTagParser(Syntax.Small),
  xsmall:    inlineTextTagParser(Syntax.XSmall),
  xxsmall:   inlineTextTagParser(Syntax.XXSmall),
  large:     inlineTextTagParser(Syntax.Large),
  xlarge:    inlineTextTagParser(Syntax.XLarge),
  xxlarge:   inlineTextTagParser(Syntax.XXLarge),
  userinput: inlineTextTagParser(Syntax.UserInput),
  cursor:    inlineTextTagParser(Syntax.Cursor),
  term:      inlineTextTagParser(Syntax.Index),
  termnoidx: inlineNonTextTagParser(Syntax.Hide),
  secref:    inlineNonTextTagParser(Syntax.Reference),
  W:         inlineNonTextTagParser(Syntax.Reference),
  par:       inlineNonTextTagParser(Syntax.Break),
  qq:        translateWithValue(inlineTextTagParser(Syntax.DoubleQuote), (v) => { return `"${v}"` }),
  file:      parseKeywordTag,
  hlink:     parseHrefTag,
  LaTex:     inlineSymbolTagParser('LaTex'),
  Tex:       inlineSymbolTagParser('Tex'),
  hearts:    inlineSymbolTagParser('❤'),
};

/**
 * get new inline tag parser to get value attribute.
 * @param {function} inlineParser - Parser function of a inline tag
 * @return {function} parser function
 */
function withValue(inlineParser) {
  return translateWithValue(inlineParser, (v) => { return v })
}

/**
 * get new inline tag parser to get value attribute.
 * @param {function} inlineParser - Parser function of a inline tag
 * @return {function} parser function
 */
 function translateWithValue(inlineParser, translateValue) {
  return (tag, context) => {
    const node = inlineParser(tag, context);
    node.value = translateValue(unescapeValue(tag.content.raw, context));
    return node;
  };
}

/**
 * get non-text tag parser function.
 * @param {string} type - type of tag
 * @return {function} parser function
 */
function inlineNonTextTagParser(type) {
  return (tag, context) =>
    parseInlineNonTextTag(type, tag, context);
}

/**
 * get text tag parser function.
 * @param {string} type - type of tag
 * @return {function} parser function
 */
function inlineTextTagParser(type) {
  return (tag, context) =>
    parseInlineTextTag(type, tag, context);
}

/**
 * parse non-text tag, which has no child.
 * @param {string} type - type of tag
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseInlineNonTextTag(type, tag, context) {
  const node = createInlineNode(type, tag.fullText, context);
  return node;
}

/**
 * get text tag parser function.
 * @param {string} type - type of tag
 * @return {function} parser function
 */
function inlineSymbolTagParser(text) {
  return (tag, context) =>
    parseSymbolTag(text, tag, context);
}

/**
 * parse text tag, which has child Str node.
 * @param {string} type - type of tag
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseInlineTextTag(type, tag, context) {
  const node = createInlineNode(type, tag.fullText, context);
  const strContext = offsetContext(context, tag.content.index);
  const strNode = createStrNode(tag.content.raw, strContext);
  node.children = [strNode];
  return node;
}

/**
 * parse @<kw>{} tag.
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseKeywordTag(tag, context) {
  const node = createInlineNode(Syntax.Keyword, tag.fullText, context);

  const pieces = tag.content.raw.split(/\s*,\s*/, 2);
  const word = pieces[0];
  if (pieces.length === 2) {
    node.alt = pieces[1];
  }

  const strNode = createStrNode(word, offsetContext(context, tag.content.index));
  node.children = [strNode];

  return node;
}

/**
 * parse @<href>{} tag.
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseHrefTag(tag, context) {
  const node = createInlineNode(Syntax.Href, tag.fullText, context);

  const pieces = tag.content.raw.split(/\s*,\s*/, 2);
  const url = pieces[0];
  let label;
  let labelOffset;
  if (pieces.length === 2) {
    label = pieces[1];
    labelOffset = tag.content.index + tag.content.raw.indexOf(label, url.length);
    assert(labelOffset >= tag.content.index);
  } else {
    label = url;
    labelOffset = tag.content.index;
  }

  const strContext = offsetContext(context, labelOffset);
  const strNode = createStrNode(label, strContext);

  node.url = url;
  node.children = [strNode];

  return node;
}

/**
 * parse @<ruby>{} tag.
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseRubyTag(tag, context) {
  const node = createInlineNode(Syntax.Ruby, tag.fullText, context);
  const pieces = tag.content.raw.split(/\s*,\s*/, 2);
  assert(pieces.length === 2);
  const rubyBase = pieces[0];
  const rubyText = pieces[1];

  const strNode = createStrNode(rubyBase, offsetContext(context, tag.content.index));

  node.rubyText = rubyText;
  node.children = [strNode];

  return node;
}

/**
 * parse @<LaTex>{} tag.
 * @param {string} text - symbol substitute text
 * @param {Tag} tag - tag to parse
 * @param {Context} context - context of the node
 * @return {TxtNode}
 */
function parseSymbolTag(text, tag, context) {
  const node = createInlineNode(Syntax.Symbol, tag.fullText, context);
  node.value = text;
  return node;
}

/**
 * parse inline tags and StrNodes from line.
 * @param {string} text - Text of the line
 * @param {Context} context - context of the node
 * @return {[TxtNode]} TxtNodes in the line
 */
export function parseText(text, context) {
  assert(!text.match(/[\r\n]/));

  return parseNestedText(text, context, 0)
}

export function parseNestedText(text, context, depth) {
  const nodes = [];
  let tag;
  while (tag = findInlineTag(text)) {
    if (tag.precedingText !== '') {
      const node = createStrNode(tag.precedingText, context);
      nodes.push(node);
      context = offsetContext(context, node.raw.length);
    }

    const parser = InlineParsers[tag.name];
    if (parser) {
      let nestedContext = Object.assign({}, context);
      nestedContext = offsetContext(nestedContext, tag.content.startIndex)
      const nestedNodes = parseNestedText(tag.content.raw, nestedContext, depth + 1)
      const node = parser(tag, contextNeedsUnescapeBraces(context));
      if( nestedNodes ) {
        node.children = nestedNodes
      }
      nodes.push(node);
    }
    context = offsetContext(context, tag.fullText.length);
    text = tag.followingText;
  }

  if (depth > 0 && !nodes.length) {
    return null;
  }

  if (text.length) {
    const node = createStrNode(text, context);
    nodes.push(node);
  }

  return nodes;
}

