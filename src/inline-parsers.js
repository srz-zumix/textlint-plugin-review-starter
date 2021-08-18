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
  ami:     inlineTextTagParser(Syntax.Amikake),
  b:       inlineTextTagParser(Syntax.Bold),
  balloon: inlineTextTagParser(Syntax.Ballon),
  bou:     inlineTextTagParser(Syntax.Bouten),
  del:     inlineTextTagParser(Syntax.Delete),
  em:      inlineTextTagParser(Syntax.Emphasis),
  i:       inlineTextTagParser(Syntax.Italic),
  idx:     inlineTextTagParser(Syntax.Index),
  ins:     inlineTextTagParser(Syntax.Insert),
  strong:  inlineTextTagParser(Syntax.Strong),
  tt:      inlineTextTagParser(Syntax.Teletype),
  ttb:     inlineTextTagParser(Syntax.TeletypeBold),
  tti:     inlineTextTagParser(Syntax.TeletypeItalic),
  tcy:     inlineTextTagParser(Syntax.TateChuYoko),
  u:       inlineTextTagParser(Syntax.Underline),

  // partially text tags
  href:    parseHrefTag,
  kw:      parseKeywordTag,
  ruby:    parseRubyTag,

  // non-text tags (reference)
  bib:     inlineNonTextTagParser(Syntax.Reference),
  chap:    inlineNonTextTagParser(Syntax.Reference),
  chapref: inlineNonTextTagParser(Syntax.Reference),
  column:  inlineNonTextTagParser(Syntax.Reference),
  eq:      inlineNonTextTagParser(Syntax.Reference),
  fn:      inlineNonTextTagParser(Syntax.Reference),
  hd:      inlineNonTextTagParser(Syntax.Reference),
  img:     inlineNonTextTagParser(Syntax.Reference),
  list:    inlineNonTextTagParser(Syntax.Reference),
  table:   inlineNonTextTagParser(Syntax.Reference),
  title:   inlineNonTextTagParser(Syntax.Reference),
  w:       inlineNonTextTagParser(Syntax.Reference),
  wb:      inlineNonTextTagParser(Syntax.Reference),

  // non-text tags
  br:      inlineNonTextTagParser(Syntax.Break),
  code:    withValue(inlineNonTextTagParser(Syntax.Code)),
  comment: withValue(inlineNonTextTagParser(Syntax.Comment)),
  embed:   inlineNonTextTagParser(Syntax.Raw),
  hidx:    inlineNonTextTagParser(Syntax.Hide),
  icon:    inlineNonTextTagParser(Syntax.Icon),
  m:       inlineNonTextTagParser(Syntax.Math),
  raw:     inlineNonTextTagParser(Syntax.Raw),
  uchar:   inlineNonTextTagParser(Syntax.UnicodeChar),

  // ---------- Starter ----------

  // text tags
  B:         inlineTextTagParser(Syntax.Strong),
  cursor:    inlineTextTagParser(Syntax.Cursor),
  qq:        translateWithValue(inlineTextTagParser(Syntax.DoubleQuote), (v) => { return `"${v}"` }),
  term:      inlineTextTagParser(Syntax.Index),
  userinput: inlineTextTagParser(Syntax.UserInput),
  weak:      inlineTextTagParser(Syntax.Weak),

  small:     inlineTextTagParser(Syntax.Small),
  xsmall:    inlineTextTagParser(Syntax.XSmall),
  xxsmall:   inlineTextTagParser(Syntax.XXSmall),
  large:     inlineTextTagParser(Syntax.Large),
  xlarge:    inlineTextTagParser(Syntax.XLarge),
  xxlarge:   inlineTextTagParser(Syntax.XXLarge),

  // partially text tags
  file:      parseKeywordTag,
  hlink:     parseHrefTag,

  // non-text tags (reference)
  noteref:   inlineNonTextTagParser(Syntax.Reference),
  secref:    inlineNonTextTagParser(Syntax.Reference),
  W:         inlineNonTextTagParser(Syntax.Reference),

  // non-text tags
  foldhere:  inlineNonTextTagParser(Syntax.Marker),
  nop:       inlineNonTextTagParser(Syntax.Nop),
  par:       inlineNonTextTagParser(Syntax.Break),
  termnoidx: inlineNonTextTagParser(Syntax.Hide),

  // symbols
  LaTeX:     inlineSymbolTagParser('LaTeX'),
  TeX:       inlineSymbolTagParser('TeX'),
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

export function supportedInlineCommands() {
  return Object.keys(InlineParsers)
}
