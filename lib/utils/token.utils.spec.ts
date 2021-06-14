import { TSESLint } from '@typescript-eslint/experimental-utils';
import { TSESTree } from '@typescript-eslint/types';

import { Punctuator, Trivia } from 'lib/ast/interface';
import { tokenize, tokenizeTrivia } from 'lib/utils/token.utils';
import { double } from 'test/utils/double.utils';

describe('tokenizeTrivia()', () => {
  describe('when the trivia is an empty string', () => {
    const trivia = '';

    it('return an empty list', () => {
      expect(tokenizeTrivia(trivia)).toEqual([]);
    });
  });

  describe('when the trivia has one or more bogus tokens', () => {
    const trivia = '  \ng';

    it('filters the bogus tokens from the values', () => {
      const tokens = tokenizeTrivia(trivia);

      expect(
        tokens.filter(token => token.type === Trivia.Garbage)
      ).toStrictEqual([]);
      expect(tokens[0].type).toBe(Trivia.Space);
      expect((tokens[0] as any).occurences).toBe(2);
      expect(tokens[1].type).toBe(Trivia.Newline);
    });
  });

  describe('when the trivia has both a newline and a trailing comma', () => {
    const trivia = ` \n,`;

    it('returns the correct tokenized values', () => {
      const tokens = tokenizeTrivia(trivia);

      expect(tokens[0].type).toBe(Trivia.Space);
      expect((tokens[0] as any).occurences).toBe(1);
      expect(tokens[1].type).toBe(Trivia.Newline);
      expect(tokens[2].type).toBe(Trivia.Comma);
    });
  });

  describe('when the trivia exceeds its maximum sequence length', () => {
    const trivia = `\n  \n g \n g\n, \n`;

    it('truncates the token list and only keeps one newline', () => {
      const tokens = tokenizeTrivia(trivia);

      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(Trivia.Newline);
    });
  });
});

describe('tokenize()', () => {
  let node: TSESTree.ImportDeclaration;
  let sourceCode: TSESLint.SourceCode;

  beforeEach(() => {
    node = double<TSESTree.ImportDeclaration>();
  });

  describe('when no tokens are returned by the source code instance.', () => {
    beforeEach(() => {
      sourceCode = double<TSESLint.SourceCode>({
        getTokens: () => [],
        getCommentsAfter: () => []
      });
    });

    it('returns an empty array', () => {
      expect(tokenize({ node, sourceCode })).toEqual([]);
    });
  });

  describe('when tokens are returned by the source code instance', () => {
    let tokens: Array<TSESTree.Token>;
    let comments: Array<TSESTree.Comment>;

    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Keyword,
          value: 'let',
          range: [0, 2]
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier,
          value: 'a',
          range: [4, 5]
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.Equals,
          range: [7, 8]
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.String,
          value: 'string',
          range: [10, 16]
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.Semicolon,
          range: [16, 17]
        })
      ];
      sourceCode = double<TSESLint.SourceCode>({
        text: `let a = 'string';`,
        getTokens: () => tokens,
        getCommentsAfter: () => comments
      });
    });

    describe('when no comments are present', () => {
      beforeEach(() => {
        comments = [];
      });

      it('returns the same untouched tokens array', () => {
        expect(tokenize({ node, sourceCode })).toEqual(tokens);
      });
    });

    describe('when a comment block is present on the same line', () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            type: TSESTree.AST_TOKEN_TYPES.Block,
            range: [8, 21]
          })
        ];
        tokens[3].range = [22, 29];
        tokens[4].range = [30, 31];
        sourceCode.text = `let a = /* comment */ 'string';`;
        sourceCode.getCommentsAfter = jest.fn(token =>
          token.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
          token.value === Punctuator.Equals
            ? comments
            : []
        );
      });

      it('returns a token array with the comment block', () => {
        const result = tokenize({ node, sourceCode });

        expect(sourceCode.getCommentsAfter).toHaveBeenCalledTimes(
          tokens.length - 1 // not called on the last token
        );
        expect(result[3].type).toBe(TSESTree.AST_TOKEN_TYPES.Block);
        expect(result[3].value).toStrictEqual('/* comment */');
      });
    });

    describe('when more than comment block is present', () => {
      beforeEach(() => {
        comments = [
          double<TSESTree.Comment>({
            type: TSESTree.AST_TOKEN_TYPES.Block,
            range: [4, 17]
          }),
          double<TSESTree.Comment>({
            type: TSESTree.AST_TOKEN_TYPES.Block,
            range: [18, 30]
          })
        ];
        tokens = [
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Keyword,
            value: 'let',
            range: [0, 2]
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Identifier,
            value: 'a',
            range: [32, 33]
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Punctuator,
            value: Punctuator.Equals,
            range: [34, 35]
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.String,
            value: 'string',
            range: [36, 45]
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Punctuator,
            value: Punctuator.Semicolon,
            range: [46, 47]
          })
        ];

        sourceCode.text = `let /* comment */ /* encore */ a = 'string';`;
        sourceCode.getCommentsAfter = jest.fn(token =>
          token.type === TSESTree.AST_TOKEN_TYPES.Keyword &&
          token.value === 'let'
            ? comments
            : []
        );
      });

      it('returns a token array with the comment block', () => {
        const result = tokenize({ node, sourceCode });

        expect(sourceCode.getCommentsAfter).toHaveBeenCalledTimes(
          tokens.length - 1 // not called on the last token
        );

        expect(result[1].type).toEqual(TSESTree.AST_TOKEN_TYPES.Block);
        expect(result[1].value).toStrictEqual('/* comment */');

        expect(result[2].type).toEqual(Trivia.Space);

        expect(result[3].type).toEqual(TSESTree.AST_TOKEN_TYPES.Block);
        expect(result[3].value).toStrictEqual('/* encore */');
      });
    });
  });
});
