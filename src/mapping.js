// LICENSE : MIT
'use strict';

export const Syntax = {
  // human readable name in ReVIEW's context => textlint name

  // textlint standard block tags
  Document: 'Document',
  Heading: 'Header',
  Paragraph: 'Paragraph',
  UnorderedList: 'List',
  OrderedList: 'List',
  DefinitionList: 'List',
  ListItem: 'ListItem',
  Table: 'Table',
  TableCell: 'ListItem',
  CodeBlock: 'CodeBlock', // Though word 'list' is used in ReVIEW's context, it's confusing
  Image: 'Image',
  Quote: 'BlockQuote',
  Comment: 'Comment',

  // textlint standard inline tags
  Str: 'Str',
  Break: 'Break',
  Code: 'Code',
  Href: 'Link',
  Keyword: 'Strong',
  Bouten: 'Emphasis',
  Amikake: 'Emphasis',
  Underline: 'Emphasis',
  Bold: 'Strong',
  Italic: 'Emphasis',
  Strong: 'Strong',
  Emphasis: 'Emphasis',
  TeletypeItalic: 'Emphasis',
  TeletypeBold: 'Strong',
  Insert: 'Emphasis',
  Delete: 'Emphasis',
  Index: 'Emphasis',
  Ballon: 'Emphasis',
  DoubleQuote: 'Str', // Starter
  Weak: 'Emphasis', // Starter
  Small: 'Emphasis', // Starter
  XSmall: 'Emphasis', // Starter
  XXSmall: 'Emphasis', // Starter
  Large: 'Emphasis', // Starter
  XLarge: 'Emphasis', // Starter
  XXLarge: 'Emphasis', // Starter
  UserInput: 'Emphasis', // Starter
  Cursor: 'Emphasis', // Starter
  Symbol: 'Emphasis', // Starter

  // ReVIEW specific block tags
  // NOTE: 'Block' means review's block having no special meanings, whose children are Paragraphs.
  Footnote: 'Footnote', // footnote block
  Caption: 'Caption', // caption text of image, table and code block
  Lead: 'Block',
  ShortColumn: 'Block',

  // ReVIEW specific inline tags
  // NOTE: 'Inline' means review's inline tag having no special meanings, whose children are Strs.
  //       'Reference' means reference to other tag, which have no child.
  //       'NonString' means non-string stuffs like character number, equation, etc.
  Teletype: 'Inline',
  TateChuYoko: 'Inline',
  Reference: 'Reference',
  Ruby: 'Ruby', // ruby in Japanese
  UnicodeChar: 'NonString',
  Hide: 'NonString',
  Icon: 'Image',
  Math: 'NonString',
  Raw: 'NonString',
  Marker: 'NonString',
};
