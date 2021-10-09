// LICENSE : MIT
'use strict';

export const ChunkTypes = {
  Paragraph: 'Paragraph',
  Heading: 'Heading',
  UnorderedList: 'UnorderedList',
  OrderedList: 'OrderedList',
  DefinitionList: 'DefinitionList',
  Block: 'Block',

  // NOTE: Comment chunk means an independent comment line. Other chunks may include comment lines.
  Comment: 'Comment',
};

/**
 * parse text and return array of chunks.
 * @param {string} text
 * @return {[Chunk]}
 */
export function parseAsChunks(text) {
  const lines = text.match(/(?:.*\r?\n|.+$)/g); // split lines preserving line endings
  //console.log(lines);
  var startIndex = 0;
  var currentChunk = null;
  var isComment = false;

  const chunks = lines.reduce(function (result, currentLine, index) {
    const line = {
      raw: currentLine, // with line endings
      text: currentLine.replace(/\r?\n$/, ''), // without line endings
      lineNumber: index + 1,
      startIndex: startIndex,
    };
    parseLine(result, line);
    startIndex += currentLine.length;
    return result;
  }, []);

  chunks.forEach(chunk => {
    const firstLineIndex = chunk.lines[0].lineNumber - 1;
    const lastLineIndex = chunk.lines[chunk.lines.length - 1].lineNumber - 1;
    chunk.raw = lines.slice(firstLineIndex, lastLineIndex + 1).join('');
  });

  return chunks;

  function parseLine(result, line) {
    // comment
    // NOTE: comment does not break current chunk, i.e. a block can contain comments in its body.
    if (line.text.startsWith('#@')) {
      line.isComment = true;
      if (line.text.startsWith('#@+++')) {
        isComment = true;
        if (currentChunk == null) {
          currentChunk = createChunk(ChunkTypes.Comment, line);
          result.push(currentChunk);
        }
      } else if(line.text.startsWith('#@---')) {
        isComment = false;
        if (currentChunk && currentChunk.type === ChunkTypes.Comment) {
          flushChunk(); // end of Comment
        }
      } else {
        if (currentChunk) {
          currentChunk.lines.push(line);
        } else {
          // A comment line corresponds to a Comment chunk.
          result.push(createChunk(ChunkTypes.Comment, line));
        }          
      }
      return;
    }

    if( isComment ) {
      if (currentChunk) {
        line.isComment = true;
        currentChunk.lines.push(line);
        return;
      }  
    }

    // block content
    if (currentChunk && currentChunk.type === ChunkTypes.Block) {
      currentChunk.lines.push(line);
      if (line.text.startsWith('//}')) {
        flushChunk(); // end of block
      }

      return;
    }

    // block open
    if (line.text.match(/^\/\/\w+/)) {
      flushChunk();
      const chunk = createChunk(ChunkTypes.Block, line);
      result.push(chunk);
      if (line.text.endsWith('{')) {
        // block with open and end tags, e.g. //list, //emlist, etc.
        currentChunk = chunk;
      }

      return;
    }

    // heading
    if (line.text.startsWith('=')) {
      flushChunk();
      result.push(createChunk(ChunkTypes.Heading, line));
      return;
    }

    // unordered list
    if (line.text.match(/^\s+\*+\s+/)) {
      if (currentChunk && currentChunk.type === ChunkTypes.UnorderedList) {
        currentChunk.lines.push(line);
      } else {
        flushChunk();
        currentChunk = createChunk(ChunkTypes.UnorderedList, line);
        result.push(currentChunk);
      }

      return;
    }

    // ordered list
    if (line.text.match(/^\s+\d+\.\s+/)) {
      if (currentChunk && currentChunk.type === ChunkTypes.OrderedList) {
        currentChunk.lines.push(line);
      } else {
        flushChunk();
        currentChunk = createChunk(ChunkTypes.OrderedList, line);
        result.push(currentChunk);
      }

      return;
    }

    // definition list
    if (line.text.match(/^\s*:\s+/)) {
      if (currentChunk && currentChunk.type === ChunkTypes.DefinitionList) {
        currentChunk.lines.push(line);
      } else {
        flushChunk();
        currentChunk = createChunk(ChunkTypes.DefinitionList, line);
        result.push(currentChunk);
      }

      return;
    }

    // continuation line of definition list
    if (line.text.match(/^\s+/) &&
        currentChunk && currentChunk.type === ChunkTypes.DefinitionList) {
      currentChunk.lines.push(line);
      return;
    }

    // empty line
    if (line.text === '') {
      flushChunk();
      return;
    }

    // normal string
    if (currentChunk && currentChunk.type === ChunkTypes.Paragraph) {
      currentChunk.lines.push(line);
    } else {
      flushChunk();
      currentChunk = createChunk(ChunkTypes.Paragraph, line);
      result.push(currentChunk);
    }
  }

  function flushChunk() {
    currentChunk = null;
  }

  function createChunk(type, firstLine) {
    return {
      type: type,
      lines: [firstLine],
    };
  }
}
