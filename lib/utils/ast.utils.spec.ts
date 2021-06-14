import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import { Character, Trivia, TriviaToken } from 'lib/ast/interface';
import {
  obtainCommentsAfter,
  obtainCommentsBefore,
  obtainIndentation,
  obtainLastLine,
  obtainNewline,
  requiresHeadNewline
} from 'lib/utils/ast.utils';
import { double } from 'test/utils/double.utils';

describe('obtainLastLine()', () => {
  let idx: number;
  let node: TSESTree.ImportDeclaration;
  let sibling: TSESTree.Node;
  let chunk: Array<TSESTree.Node>;

  beforeEach(() => {
    node = double<TSESTree.ImportDeclaration>({
      loc: {
        start: { line: 9 },
        end: { line: 9 }
      }
    });
    sibling = double<TSESTree.Node>({
      loc: {
        start: { line: node.loc.start.line + 1 },
        end: { line: node.loc.end.line + 1 }
      }
    });
    chunk = [node, sibling];
  });

  describe('when index is 0', () => {
    beforeEach(() => {
      idx = 0;
    });

    it('returns the line before the node start location as last line', () => {
      const result = obtainLastLine({
        node,
        idx,
        chunk
      });

      expect(result).toEqual(node.loc.start.line - 1);
    });
  });

  describe(`when index is different from 0`, () => {
    beforeEach(() => {
      idx = 2;
    });

    it('returns the precedent sibling end location as last line', () => {
      const result = obtainLastLine({
        node,
        idx,
        chunk
      });

      expect(result).toEqual(sibling.loc.end.line);
    });
  });
});

describe('obtainCommentsBefore()', () => {
  let idx: number;
  let lastLine: number;
  let node: TSESTree.Node;
  let sourceCode: TSESLint.SourceCode;
  let comments: Array<TSESTree.Comment>;

  beforeEach(() => {
    node = double<TSESTree.Node>({
      loc: {
        start: { line: 4 },
        end: { line: 4 }
      }
    });
    sourceCode = double<TSESLint.SourceCode>();
  });

  describe('when index is 0', () => {
    beforeEach(() => {
      idx = 0;
      lastLine = 3;
    });

    describe('when comment start line is over the last line', () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            loc: {
              start: { line: lastLine + 1 },
              end: { line: lastLine + 1 }
            }
          })
        ];
        sourceCode.getCommentsBefore = jest.fn(() => comments);
      });

      it('returns the comment', () => {
        expect(
          obtainCommentsBefore({ node, idx, sourceCode, lastLine })
        ).toEqual(comments);
      });
    });

    describe('when comment start line is under the last line', () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            loc: {
              start: { line: lastLine },
              end: { line: lastLine }
            }
          })
        ];
        sourceCode.getCommentsBefore = jest.fn(() => comments);
      });

      it('returns no comments', () => {
        expect(
          obtainCommentsBefore({ node, idx, sourceCode, lastLine })
        ).toEqual([]);
      });
    });
  });

  describe('when index is greater than 0', () => {
    beforeEach(() => {
      idx = 1;
      lastLine = 6;
    });

    describe('when comment starts at same level as the node', () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            loc: {
              start: { line: node.loc.start.line },
              end: { line: lastLine + 1 }
            }
          })
        ];
        sourceCode.getCommentsBefore = jest.fn(() => comments);
      });

      it('returns the comment', () => {
        expect(
          obtainCommentsBefore({ node, idx, sourceCode, lastLine })
        ).toEqual(comments);
      });
    });

    describe(`when the comment is positioned after the node`, () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            loc: {
              start: { line: 5 },
              end: { line: 5 }
            }
          })
        ];
        sourceCode.getCommentsBefore = jest.fn(() => comments);
      });

      it('returns no comments', () => {
        expect(
          obtainCommentsBefore({ node, idx, sourceCode, lastLine })
        ).toEqual([]);
      });
    });

    describe(`when the comment is positioned before the node`, () => {
      beforeEach(() => {
        lastLine = 2;
        comments = [
          double<TSESTree.Comment>({
            loc: {
              start: { line: 3 },
              end: { line: 3 }
            }
          })
        ];
        sourceCode.getCommentsBefore = jest.fn(() => comments);
      });

      describe('when the comment end line is positioned after the last line', () => {
        beforeEach(() => {
          comments[0].loc.end.line = lastLine + 1;
        });

        it('returns the comment', () => {
          expect(
            obtainCommentsBefore({ node, idx, sourceCode, lastLine })
          ).toEqual(comments);
        });
      });

      describe('when the comment end line is positioned before the last line', () => {
        beforeEach(() => {
          comments[0].loc.end.line = lastLine - 1;
        });

        it('returns no comments', () => {
          expect(
            obtainCommentsBefore({ node, idx, sourceCode, lastLine })
          ).toEqual([]);
        });
      });
    });
  });
});

describe('obtainCommentsAfter()', () => {
  let node: TSESTree.Node;
  let sourceCode: TSESLint.SourceCode;
  let comments: Array<TSESTree.Comment>;

  beforeEach(() => {
    node = double<TSESTree.Node>({
      loc: {
        end: { line: 1 }
      }
    });
    sourceCode = double<TSESLint.SourceCode>();
  });

  describe(`when the comment end line doesn't match the node one`, () => {
    beforeEach(() => {
      comments = [
        double<TSESTree.Comment>({
          loc: {
            end: { line: node.loc.end.line + 1 }
          }
        })
      ];
      sourceCode.getCommentsAfter = jest.fn(() => comments);
    });

    it('returns no comments', () => {
      expect(obtainCommentsAfter({ node, sourceCode })).toEqual([]);
    });
  });

  describe('when the comment end line match the node one', () => {
    beforeEach(() => {
      comments = [
        double<TSESTree.Comment>({
          loc: {
            end: { line: node.loc.end.line }
          }
        })
      ];
      sourceCode.getCommentsAfter = jest.fn(() => comments);
    });

    it('returns the comment', () => {
      expect(obtainCommentsAfter({ node, sourceCode })).toEqual(comments);
    });
  });
});

describe('obtainIndentation()', () => {
  let node: TSESTree.Node;
  let sourceCode: TSESLint.SourceCode;
  let tokenBefore: TSESTree.Token;
  const getTokenBefore = () =>
    tokenBefore as TSESLint.SourceCode.ReturnTypeFromOptions<TSESLint.SourceCode.CursorWithSkipOptions>;

  describe('when the token positioned before is null', () => {
    beforeEach(() => {
      sourceCode = double<TSESLint.SourceCode>({
        text: '  const [, addr] = example;',
        getTokenBefore: () => null
      });
      node = double<TSESTree.Node>({
        range: [2]
      });
    });

    it('returns a 2 spaces indentation', () => {
      expect(obtainIndentation({ node, sourceCode })).toStrictEqual(
        ' '.repeat(2)
      );
    });
  });

  describe(`when the token positioned before isn't null`, () => {
    describe('in a single line identation context', () => {
      beforeEach(() => {
        node = double<TSESTree.Node>({
          range: [4]
        });
        tokenBefore = double<TSESTree.Token>({
          range: [0, 2]
        });
        sourceCode = double<TSESLint.SourceCode>({
          text: '    let foo = false;',
          getTokenBefore
        });
      });

      it('returns an empty character', () => {
        expect(obtainIndentation({ node, sourceCode })).toStrictEqual(
          Character.Empty
        );
      });
    });

    describe('in a multiple line indentation context', () => {
      beforeEach(() => {
        node = double<TSESTree.Node>({
          range: [4]
        });
        tokenBefore = double<TSESTree.Token>({
          range: [0, 1]
        });
        sourceCode = double<TSESLint.SourceCode>({
          text: `*/\n  let foo = false;`,
          getTokenBefore
        });
      });

      it('returns a single space indentation', () => {
        expect(obtainIndentation({ node, sourceCode })).toStrictEqual(' ');
      });
    });
  });
});

describe('obtainNewline()', () => {
  let sourceCode: TSESLint.SourceCode;

  describe(`when the source code doesn't have a newline at all`, () => {
    beforeEach(() => {
      sourceCode = double<TSESLint.SourceCode>({
        text: 'no-newline'
      });
    });

    it('returns the default newline character', () => {
      expect(obtainNewline(sourceCode)).toStrictEqual(Character.Newline);
    });
  });

  describe('when the source code does have a newline', () => {
    beforeEach(() => {
      sourceCode = double<TSESLint.SourceCode>({
        text: 'newline\r\n'
      });
    });

    it('returns the extracted newline character(s)', () => {
      expect(obtainNewline(sourceCode)).toStrictEqual('\r\n');
    });
  });
});

describe('requiresHeadNewline()', () => {
  let tokens: Array<TSESTree.Token | TriviaToken>;

  describe('when provided tokens are all spaces', () => {
    beforeEach(() => {
      tokens = [
        double<TriviaToken>({ type: Trivia.Space }),
        double<TriviaToken>({ type: Trivia.Space })
      ];
    });

    it('returns false', () => {
      expect(requiresHeadNewline(tokens)).toBe(false);
    });
  });

  describe('when first token is a line', () => {
    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({ type: TSESTree.AST_TOKEN_TYPES.Line })
      ];
    });

    it('returns true', () => {
      expect(requiresHeadNewline(tokens)).toBe(true);
    });
  });

  describe('when first token is a block without a newline', () => {
    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Block,
          value: 'no-newline'
        })
      ];
    });

    it('returns true', () => {
      expect(requiresHeadNewline(tokens)).toBe(false);
    });
  });

  describe('when first token is a block with a newline', () => {
    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Block,
          value: 'newline\n'
        })
      ];
    });

    it('returns true', () => {
      expect(requiresHeadNewline(tokens)).toBe(true);
    });
  });
});
