import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import {
  AugmentedImportDeclaration,
  AugmentedImportDeclarationOptions,
  ImportSegments,
  SpecifiersState
} from 'lib/ast/declaration';
import {
  Character,
  Chunk,
  Punctuator,
  Trivia,
  TriviaToken
} from 'lib/ast/interface';
import { Specifier, SpecifierPosition } from 'lib/ast/specifier';
import { ImportsStrategy } from 'lib/strategies/interface';
import {
  obtainCommentsAfter,
  obtainCommentsBefore,
  obtainIndentation,
  obtainLastLine,
  requiresHeadNewline
} from 'lib/utils/ast.utils';
import { renderComments } from 'lib/utils/comment.utils';
import { tokenize } from 'lib/utils/token.utils';
import { double } from 'test/utils/double.utils';

jest.mock('lib/utils/ast.utils', () => ({
  obtainCommentsAfter: jest.fn(),
  obtainCommentsBefore: jest.fn(),
  obtainIndentation: jest.fn(),
  obtainLastLine: jest.fn(),
  requiresHeadNewline: jest.fn()
}));

jest.mock('lib/utils/comment.utils', () => ({
  ...jest.requireActual('lib/utils/comment.utils'),
  renderComments: jest.fn()
}));

jest.mock('lib/utils/token.utils', () => ({
  tokenize: jest.fn()
}));

const { CommentPosition } = jest.requireActual('lib/utils/comment.utils');

type ReturnType =
  TSESLint.SourceCode.ReturnTypeFromOptions<TSESLint.SourceCode.CursorWithSkipOptions>;

describe('AugmentedImportDeclaration', () => {
  let subject: AugmentedImportDeclaration;
  let node: TSESTree.ImportDeclaration;
  let sourceCode: TSESLint.SourceCode;

  const build = (
    options?: Partial<AugmentedImportDeclarationOptions>
  ): AugmentedImportDeclaration => {
    return new AugmentedImportDeclaration({
      node: double<TSESTree.ImportDeclaration>(),
      idx: 0,
      sourceCode: double<TSESLint.SourceCode>(),
      chunk: double<Chunk<TSESTree.ImportDeclaration>>(),
      strategy: double<ImportsStrategy>(),
      ...options
    });
  };

  beforeEach(() => {
    subject = build();
  });

  describe('node()', () => {
    it('returns the node from the options object', () => {
      expect(subject.node).toBe(subject.options.node);
    });
  });

  describe('sourceCode()', () => {
    it('returns the source-code instance from the options object', () => {
      expect(subject.sourceCode).toBe(subject.options.sourceCode);
    });
  });

  describe('idx()', () => {
    it('returns the index from the options object', () => {
      expect(subject.idx).toBe(subject.options.idx);
    });
  });

  describe('source()', () => {
    describe('when the node has a source value', () => {
      beforeEach(() => {
        node = double<TSESTree.ImportDeclaration>({
          source: {
            value: 'source'
          }
        });
        subject = build({ node });
      });

      it('returns the source value as string representation', () => {
        expect(subject.source).toBe(node.source.value);
      });
    });

    describe('when the node has a source name', () => {
      beforeEach(() => {
        node = double<TSESTree.Node>({
          source: {
            name: 'source'
          }
        }) as TSESTree.ImportDeclaration;
        subject = build({ node });
      });

      it('returns the source name as string representation', () => {
        expect(subject.source).toBe(
          (node.source as unknown as Record<string, string>).name
        );
      });
    });
  });

  describe('segments()', () => {
    let commentsBefore: Array<TSESTree.Comment>;
    let commentsAfter: Array<TSESTree.Comment>;
    let indentation: string;
    const lastLine = 1;

    beforeEach(() => {
      (obtainCommentsBefore as jest.Mock).mockReturnValueOnce(commentsBefore);
      (obtainCommentsAfter as jest.Mock).mockReturnValueOnce(commentsAfter);
      (obtainIndentation as jest.Mock).mockReturnValueOnce(indentation);
      (obtainLastLine as jest.Mock).mockReturnValueOnce(lastLine);
    });

    it('assigns and returns the computed segments', () => {
      const { node, idx, sourceCode } = subject;
      expect(subject.segments.commentsBefore).toBe(commentsBefore);
      expect(obtainCommentsBefore).toHaveBeenCalledWith({
        node,
        idx,
        sourceCode,
        lastLine
      });

      expect(subject.segments.commentsAfter).toBe(commentsAfter);
      expect(obtainCommentsAfter).toHaveBeenCalledWith({ node, sourceCode });
      expect(obtainLastLine).toHaveBeenCalledWith({
        node,
        idx,
        chunk: subject.options.chunk
      });

      expect(subject.segments.indentation).toBe(indentation);
      expect(obtainIndentation).toHaveBeenCalledWith({ node, sourceCode });
    });

    it('memoizes the computation', () => {
      let segments = subject.segments;
      segments = subject.segments;

      expect(segments).not.toBeUndefined();
      [obtainCommentsBefore, obtainCommentsAfter, obtainIndentation].forEach(
        mock => expect(mock).toHaveBeenCalledTimes(1)
      );
    });
  });

  describe('tokens()', () => {
    const tokens = [{ type: TSESTree.AST_TOKEN_TYPES.Punctuator, value: ',' }];

    beforeEach(() => {
      (tokenize as jest.Mock).mockReturnValueOnce(tokens);
    });

    it('tokenizes the import declaration node', () => {
      const { node, sourceCode } = subject;
      expect(subject.tokens).toBe(tokens);
      expect(tokenize).toHaveBeenCalledWith({ node, sourceCode });
    });

    it('memoizes the tokenization', () => {
      let tokens = subject.tokens;
      tokens = subject.tokens;

      expect(tokens).not.toBeUndefined();
      expect(tokenize).toHaveBeenCalledTimes(1);
    });
  });

  describe('importClauses()', () => {
    beforeEach(() => {
      node = double<TSESTree.ImportDeclaration>({
        specifiers: [double<TSESTree.ImportClause>()]
      });
      subject = build({ node });
    });

    it('returns the node specifiers (which are in fact import clauses)', () => {
      expect(subject.importClauses).toBe(node.specifiers);
    });
  });

  describe('importSpecifiers()', () => {
    beforeEach(() => {
      node = double<TSESTree.ImportDeclaration>({
        specifiers: [
          double<TSESTree.ImportClause>({
            type: TSESTree.AST_NODE_TYPES.ImportNamespaceSpecifier
          }),
          double<TSESTree.ImportClause>({
            type: TSESTree.AST_NODE_TYPES.ImportSpecifier
          })
        ]
      });
      subject = build({ node });
    });

    it('returns a filtered array of specifiers', () => {
      expect(subject.importSpecifiers).toEqual([node.specifiers[1]]);
    });

    it('memoizes the filtered array', () => {
      const spy = jest.spyOn(subject, 'importClauses', 'get');
      let specifiers = subject.importSpecifiers;
      specifiers = subject.importSpecifiers;

      expect(specifiers).not.toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('braceTokenRange()', () => {
    let tokens: Array<TSESTree.Token>;
    let spy: jest.SpyInstance;

    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.OpenBrace
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.CloseBrace
        })
      ];
      spy = jest.spyOn(subject, 'tokens', 'get').mockReturnValue(tokens);
    });

    it('returns the range', () => {
      expect(subject.braceTokenRange).toStrictEqual([0, 1]);
    });

    it('memoizises the range', () => {
      let tokens = subject.braceTokenRange;
      tokens = subject.braceTokenRange;

      expect(tokens).not.toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('importSpecifierTokens()', () => {
    let tokens: Array<TSESTree.Token>;
    let spy: jest.SpyInstance;

    beforeEach(() => {
      tokens = [
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.OpenBrace
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier,
          value: 'foo'
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier,
          value: 'bar'
        }),
        double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator,
          value: Punctuator.CloseBrace
        })
      ];
      spy = jest.spyOn(subject, 'tokens', 'get').mockReturnValue(tokens);
    });

    it('returns an array of specifier tokens (without the braces)', () => {
      expect(subject.importSpecifierTokens).toStrictEqual(
        tokens.slice(1, tokens.length - 1)
      );
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('specifiersState()', () => {
    describe('when the specifiers state object is already memoized', () => {
      let spy: jest.SpyInstance;

      beforeEach(() => {
        subject['_specifiersState'] = {
          identifiers: [double<Specifier>()],
          before: [],
          after: []
        };
        spy = jest.spyOn(subject, 'importSpecifierTokens', 'get');
      });

      it('returns the specifier state without re-memoizing it', () => {
        expect(subject.specifiersState).toEqual(subject['_specifiersState']);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when the specifiers state is not initialized', () => {
      let specifiersTokens: Array<TSESTree.Token>;
      let spy: jest.SpyInstance;

      beforeEach(() => {
        specifiersTokens = [
          double<TSESTree.Token>({ value: '' }),
          double<TSESTree.Token>({ value: '' }),
          double<TSESTree.Token>({ value: '' })
        ];
        subject['handleBeforeIdentifier'] = jest.fn((specifier, token) => {
          subject['_specifiersState'].before.push(token);
          specifier.position = SpecifierPosition.After;
          return specifier;
        });
        subject['handleAfterIdentifier'] = jest.fn((specifier, token) => {
          subject['_specifiersState'].after.push(token);
          specifier.position = undefined;
          return specifier;
        });
        subject['handleIdentifier'] = jest.fn(specifier => {
          subject['_specifiersState'].identifiers.push(specifier);
          specifier.position = SpecifierPosition.Before;
        });
        subject['handleLastSpecifier'] = jest.fn();
        subject['updateIdentifierNodes'] = jest.fn(() => [double<Specifier>()]);
        spy = jest
          .spyOn(subject, 'importSpecifierTokens', 'get')
          .mockReturnValue(specifiersTokens);
      });

      it('initializes the specifiers state', () => {
        const state = subject.specifiersState;

        expect(subject['handleIdentifier']).toHaveBeenCalledTimes(1);
        expect(subject['handleBeforeIdentifier']).toHaveBeenCalledTimes(1);
        expect(subject['handleAfterIdentifier']).toHaveBeenCalledTimes(1);
        expect(subject['handleLastSpecifier']).toHaveBeenCalledTimes(1);
        expect(subject['updateIdentifierNodes']).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledTimes(1);
        Object.values(state).forEach(collection =>
          expect(collection.length).not.toBe(0)
        );
      });
    });
  });

  describe('hasSpecifiers()', () => {
    let spies: Record<string, jest.SpyInstance>;

    beforeEach(() => {
      spies = {
        braceTokenRange: jest.spyOn(subject, 'braceTokenRange', 'get'),
        importSpecifiers: jest.spyOn(subject, 'importSpecifiers', 'get')
      };
    });

    describe('when the import specifiers array is empty', () => {
      beforeEach(() => {
        spies.importSpecifiers.mockReturnValue([]);
        spies.braceTokenRange.mockReturnValue([0, 5]);
      });

      it('returns false', () => {
        expect(subject.hasSpecifiers()).toBe(false);
      });
    });

    describe(`when the import specifiers array isn't empty`, () => {
      beforeEach(() => {
        spies.importSpecifiers.mockReturnValue([
          double<TSESTree.ImportSpecifier>()
        ]);
      });

      describe('when the brace tokens range does include a -1 value', () => {
        beforeEach(() => {
          spies.braceTokenRange.mockReturnValue([-1, 5]);
        });

        it('returns false', () => {
          expect(subject.hasSpecifiers()).toBe(false);
        });
      });

      describe(`when the brace tokens range doesn't include a -1 value`, () => {
        beforeEach(() => {
          spies.braceTokenRange.mockReturnValue([0, 5]);
        });

        it('returns true', () => {
          expect(subject.hasSpecifiers()).toBe(true);
        });
      });
    });
  });

  describe('isSideEffect()', () => {
    let spies: Record<string, jest.SpyInstance>;

    describe('when the importClauses array is empty', () => {
      beforeEach(() => {
        sourceCode = double<TSESLint.SourceCode>({
          getFirstToken: () => {
            return {
              value: Punctuator.CloseBrace
            } as ReturnType;
          }
        });
        subject = build({ sourceCode });
        spies = {
          importClauses: jest
            .spyOn(subject, 'importClauses', 'get')
            .mockReturnValue([])
        };
      });

      it('returns true', () => {
        expect(subject.isSideEffect()).toBe(true);
        expect(spies.importClauses).toHaveBeenCalledTimes(1);
      });
    });

    describe(`when the node isn't an import of type value`, () => {
      beforeEach(() => {
        node = double<TSESTree.ImportDeclaration>({
          importKind: 'type'
        });
        sourceCode = double<TSESLint.SourceCode>({
          getFirstToken: () => {
            return {} as ReturnType;
          }
        });
        subject = build({ node, sourceCode });
        spies = {
          importClauses: jest
            .spyOn(subject, 'importClauses', 'get')
            .mockReturnValue([])
        };
      });

      it('returns false', () => {
        expect(subject.isSideEffect()).toBe(false);
        expect(spies.importClauses).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the first token returned is an open brace', () => {
      beforeEach(() => {
        node = double<TSESTree.ImportDeclaration>({
          importKind: 'type'
        });
        sourceCode = double<TSESLint.SourceCode>({
          getFirstToken: () => null
        });
        subject = build({ sourceCode });
        spies = {
          importClauses: jest
            .spyOn(subject, 'importClauses', 'get')
            .mockReturnValue([])
        };
      });

      it('returns false', () => {
        expect(subject.isSideEffect()).toBe(true);
        expect(spies.importClauses).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('renderTokens()', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(subject, 'tokens', 'get');
    });

    describe('when the tokens array is empty', () => {
      beforeEach(() => {
        spy.mockReturnValue([]);
      });

      it('returns a semicolon alone', () => {
        expect(subject.renderTokens()).toBe(Punctuator.Semicolon);
      });
    });

    describe('when the last token is a semicolon', () => {
      beforeEach(() => {
        spy.mockReturnValue([
          double<TSESTree.Token>({ value: 'return' }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Punctuator,
            value: Punctuator.Semicolon
          })
        ]);
      });

      it('renders without adding an additional semicolon', () => {
        expect(subject.renderTokens()).toBe('return;');
      });
    });

    describe(`when the last token isn't a semicolon`, () => {
      beforeEach(() => {
        spy.mockReturnValue([double<TSESTree.Token>({ value: 'return' })]);
      });

      it('adds a semicolon to the rendering', () => {
        expect(subject.renderTokens()).toBe('return;');
      });
    });
  });

  describe('renderNode()', () => {
    describe('when the declaration has no specifiers', () => {
      beforeEach(() => {
        subject.renderTokens = jest.fn();
        subject.hasSpecifiers = jest.fn(() => false);
      });

      it('skips and renders the tokens directly', () => {
        subject.renderNode();

        expect(subject.hasSpecifiers).toHaveBeenCalled();
        expect(subject.renderTokens).toHaveBeenCalled();
      });
    });

    describe('when the declaration has specifiers', () => {
      let spies: Record<string, jest.SpyInstance>;
      let identifiers: Array<Specifier>;
      let tokens: Array<TSESTree.Token | TriviaToken>;
      let specifiersState: SpecifiersState;
      let braceTokenRange: [number, number];

      beforeEach(() => {
        identifiers = [
          double<Specifier>({
            before: [
              double<TSESTree.Token>({
                type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                value: Punctuator.OpenBrace
              }),
              double<TriviaToken>({
                type: Trivia.Space,
                value: Character.Space,
                occurences: 1
              })
            ],
            after: [
              double<TriviaToken>({
                type: Trivia.Space,
                value: Character.Space,
                occurences: 1
              }),
              double<TSESTree.Token>({
                type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                value: Punctuator.CloseBrace
              })
            ],
            tokens: [
              double<TSESTree.Token>({
                type: TSESTree.AST_TOKEN_TYPES.Identifier,
                value: 'foo'
              })
            ]
          })
        ];
        tokens = [
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Keyword,
            value: `import`
          }),
          double<TriviaToken>({
            type: Trivia.Space,
            value: Character.Space,
            occurences: 1
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Identifier
          }),
          double<TriviaToken>({
            type: Trivia.Space,
            value: Character.Space,
            occurences: 1
          }),
          double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Keyword,
            value: `from 'bar'`
          })
        ];
        subject.hasSpecifiers = jest.fn(() => true);
        subject.options.strategy.sortIdentifiers = jest.fn(
          identifiers => identifiers
        );
        specifiersState = {
          identifiers,
          before: [],
          after: []
        };
        braceTokenRange = [1, 2];
        spies = {
          tokens: jest.spyOn(subject, 'tokens', 'get').mockReturnValue(tokens),
          braceTokenRange: jest
            .spyOn(subject, 'braceTokenRange', 'get')
            .mockReturnValue(braceTokenRange),
          specifiersState: jest
            .spyOn(subject, 'specifiersState', 'get')
            .mockReturnValue(specifiersState)
        };
      });

      describe('when the last specifier has a trailing comma', () => {
        let sourceCode: TSESLint.SourceCode;

        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(
              () =>
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.Comma
                }) as ReturnType
            )
          });

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
        });

        it('renders the node with the trailing comma', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import { foo, } from 'bar';`
          );
        });
      });

      describe(`when the last punctuator isn't a comma`, () => {
        let sourceCode: TSESLint.SourceCode;

        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(
              () =>
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.Semicolon
                }) as ReturnType
            )
          });

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
        });

        it('renders the node without the trailing comma', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import { foo } from 'bar';`
          );
        });
      });

      describe('when specifier has a comma', () => {
        beforeEach(() => {
          identifiers = [
            double<Specifier>({
              hasComma: true,
              before: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.OpenBrace
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                })
              ],
              after: [
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                }),
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.CloseBrace
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                })
              ],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                })
              ]
            })
          ];
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(
              () =>
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.Comma
                }) as ReturnType
            )
          });

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
          specifiersState.identifiers = identifiers;
        });

        it('renders the node with a comma', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import { foo, } from 'bar';`
          );
        });
      });

      describe('when the declaration has a semicolon', () => {
        let sourceCode: TSESLint.SourceCode;

        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(() => null)
          });
          identifiers = [
            double<Specifier>({
              hasComma: true,
              before: [],
              after: [],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                })
              ]
            })
          ];
          tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Keyword,
              value: `import`
            }),
            double<TriviaToken>({
              type: Trivia.Space,
              value: Character.Space,
              occurences: 1
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TriviaToken>({
              type: Trivia.Space,
              value: Character.Space,
              occurences: 1
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Keyword,
              value: `from 'bar'`
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Punctuator,
              value: Punctuator.Semicolon
            })
          ];
          spies.tokens = jest
            .spyOn(subject, 'tokens', 'get')
            .mockReturnValue(tokens);
          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
          specifiersState.identifiers = identifiers;
        });

        it('renders the node', () => {
          expect(subject.renderNode()).toStrictEqual(`import foo from 'bar';`);
        });
      });

      describe(`when the last specifier doesn't have a trailing comma`, () => {
        let sourceCode: TSESLint.SourceCode;

        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(
              () =>
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                }) as ReturnType
            )
          });

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
        });

        it('renders the node without any trailing commas', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import { foo } from 'bar';`
          );
        });
      });

      describe(`when there aren't any non-blank after the identifier`, () => {
        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(() => null)
          });
          identifiers = [
            double<Specifier>({
              hasComma: true,
              before: [],
              after: [],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                })
              ]
            })
          ];

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
          specifiersState.identifiers = identifiers;
        });

        it('renders the node without any trailing commas', () => {
          expect(subject.renderNode()).toStrictEqual(`import foo from 'bar';`);
        });
      });

      describe(`when the trailing trivia has anything else than spaces`, () => {
        beforeEach(() => {
          sourceCode = double<TSESLint.SourceCode>({
            getTokenBefore: jest.fn(() => null)
          });
          identifiers = [
            double<Specifier>({
              hasComma: true,
              before: [],
              after: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Line
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                }),
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Line
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                }),
                double<TriviaToken>({
                  type: Trivia.Newline,
                  value: Character.Newline
                })
              ],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                })
              ]
            })
          ];

          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(sourceCode);
          specifiersState.identifiers = identifiers;
        });

        it('renders the node', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import foo  \n from 'bar';`
          );
        });
      });

      describe('when the first token is a comment line', () => {
        beforeEach(() => {
          (requiresHeadNewline as jest.Mock).mockReturnValue(true);
          spies.sourceCode = jest
            .spyOn(subject, 'sourceCode', 'get')
            .mockReturnValue(
              double<TSESLint.SourceCode>({
                getTokenBefore: () => null
              })
            );
          identifiers = [
            double<Specifier>({
              before: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.OpenBrace
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                })
              ],
              after: [
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                })
              ],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'foo'
                })
              ]
            }),
            double<Specifier>({
              before: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Line,
                  value: '// comment'
                }),
                double<TriviaToken>({
                  type: Trivia.Newline,
                  value: Character.Newline
                }),
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                }),
                double<TriviaToken>({
                  type: Trivia.Comma,
                  value: Punctuator.Comma
                })
              ],
              after: [
                double<TriviaToken>({
                  type: Trivia.Space,
                  value: Character.Space,
                  occurences: 1
                }),
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Punctuator,
                  value: Punctuator.CloseBrace
                })
              ],
              tokens: [
                double<TSESTree.Token>({
                  type: TSESTree.AST_TOKEN_TYPES.Identifier,
                  value: 'qux'
                })
              ]
            })
          ];
          specifiersState.identifiers = identifiers;
        });

        it('renders the node without commenting bits of the declaration', () => {
          expect(subject.renderNode()).toStrictEqual(
            `import \n{ foo,\n// comment\n ,qux }\n from 'bar';`
          );
        });
      });
    });
  });

  describe('toString()', () => {
    let spies: Record<string, jest.SpyInstance>;

    beforeEach(() => {
      (renderComments as jest.Mock).mockReturnValue('/* comment */');
      spies = {
        segments: jest.spyOn(subject, 'segments', 'get').mockReturnValue(
          double<ImportSegments>({
            commentsBefore: [],
            commentsAfter: [],
            indentation: '  '
          })
        ),
        renderNode: jest
          .spyOn(subject, 'renderNode')
          .mockReturnValue(`import { foo } from 'bar';`)
      };
    });

    it('renders the import declaration as a string', () => {
      const { node, sourceCode } = subject;
      expect(subject.toString()).toBe(
        `  /* comment */import { foo } from 'bar';/* comment */`
      );

      expect(renderComments).toHaveBeenCalledWith({
        node,
        sourceCode,
        comments: subject.segments.commentsBefore,
        position: CommentPosition.Before
      });
      expect(spies.renderNode).toHaveBeenCalledTimes(1);
      expect(renderComments).toHaveBeenCalledWith({
        node,
        sourceCode,
        comments: subject.segments.commentsAfter,
        position: CommentPosition.After
      });
    });

    it('memoizes the rendered value', () => {
      let render = subject.toString();
      render = subject.toString();

      expect(render).not.toBeUndefined();
      expect(spies.renderNode).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleBeforeIdentifier()', () => {
    let token: TSESTree.Token | TriviaToken;
    let specifier: Specifier;

    beforeEach(() => {
      specifier = new Specifier();
    });

    describe('when the token is a newline', () => {
      beforeEach(() => {
        token = double<TriviaToken>({
          type: Trivia.Newline,
          value: Character.Newline
        });
      });

      describe('when the specifiers state is empty', () => {
        beforeEach(() => {
          subject['_specifiersState'] = {
            identifiers: [],
            before: [],
            after: []
          };
        });

        it('registers the token and returns a new specifier instance', () => {
          const result = subject['handleBeforeIdentifier'](specifier, token);

          expect(subject['_specifiersState'].before).toContain(token);
          expect(result).not.toBe(specifier);
        });
      });

      describe('when the specifiers state is already dirty', () => {
        beforeEach(() => {
          subject['_specifiersState'] = {
            identifiers: [new Specifier()],
            before: [double<TSESTree.Token>()],
            after: []
          };
        });

        it('updates the specifier with the token', () => {
          const result = subject['handleBeforeIdentifier'](specifier, token);

          expect(result.before).toContain(token);
        });
      });
    });

    describe('when the token is a space', () => {
      beforeEach(() => {
        token = double<TriviaToken>({
          type: Trivia.Space,
          value: Character.Space
        });
      });

      it('updates the specifier with the token', () => {
        const result = subject['handleBeforeIdentifier'](specifier, token);

        expect(result.before).toContain(token);
      });
    });

    describe('when the token is a comment line', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Line,
          value: 'comment'
        });
      });

      it('updates the specifier with the token', () => {
        const result = subject['handleBeforeIdentifier'](specifier, token);

        expect(result.before).toContain(token);
      });
    });

    describe('when the token is an identifier', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier
        });
        specifier.before = [token];
      });

      describe('when the specifiers state is empty', () => {
        beforeEach(() => {
          subject['_specifiersState'] = {
            identifiers: [],
            before: [],
            after: []
          };
        });

        it('registers the token and returns a new specifier instance', () => {
          const result = subject['handleBeforeIdentifier'](specifier, token);

          expect(subject['_specifiersState'].before).toContain(token);
          expect(result).not.toBe(specifier);
        });
      });

      describe('when the specifiers state is dirty', () => {
        beforeEach(() => {
          subject['_specifiersState'] = {
            identifiers: [new Specifier()],
            before: [double<TSESTree.Token>()],
            after: []
          };
        });

        it('updates the specifier with the token', () => {
          const result = subject['handleBeforeIdentifier'](specifier, token);

          expect(result.position).toBeUndefined();
          expect(result.tokens).toContain(token);
        });
      });
    });
  });

  describe('handleAfterIdentifier()', () => {
    let token: TSESTree.Token | TriviaToken;
    let specifier: Specifier;

    beforeEach(() => {
      specifier = new Specifier();
    });

    describe('when the token is a newline', () => {
      beforeEach(() => {
        token = {
          type: Trivia.Newline,
          value: Character.Newline
        };
      });

      describe('when the specifiers state is empty', () => {
        beforeEach(() => {
          subject['_specifiersState'] = {
            identifiers: [],
            before: [],
            after: []
          };
        });

        it('registers the token and returns a new specifier instance', () => {
          const result = subject['handleAfterIdentifier'](specifier, token);

          expect(specifier.after).toContain(token);
          expect(subject['_specifiersState'].identifiers).toContain(specifier);
          expect(result).not.toBe(specifier);
        });
      });
    });

    describe('when the token is a space', () => {
      beforeEach(() => {
        token = double<TriviaToken>({
          type: Trivia.Space,
          value: Character.Space
        });
      });

      it('registers the token on the specifier', () => {
        subject['handleAfterIdentifier'](specifier, token);

        expect(specifier.after).toContain(token);
      });
    });

    describe('when the token is a comment line', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Line
        });
      });

      it('registers the token on the specifier', () => {
        subject['handleAfterIdentifier'](specifier, token);

        expect(specifier.after).toContain(token);
      });
    });

    describe('when the token is a comment block', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Block
        });
      });

      describe('when the comment block value has a newline', () => {
        beforeEach(() => {
          token.value = 'comment\nanother-comment';
        });

        it('registers the token and return a new specifier instance', () => {
          const result = subject['handleAfterIdentifier'](specifier, token);

          expect(subject['_specifiersState'].identifiers).toContain(specifier);
          expect(result).not.toBe(specifier);
          expect(result.before).toContain(token);
        });
      });

      describe('when the comment block value has no newline', () => {
        beforeEach(() => {
          token.value = 'comment';
        });

        it('updates the specifier with the token', () => {
          const result = subject['handleAfterIdentifier'](specifier, token);
          expect(result.after).toContain(token);
        });
      });
    });

    describe('when the token is an identifier', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier
        });
      });

      it('registers the token and return a new specifier instance', () => {
        const result = subject['handleAfterIdentifier'](specifier, token);

        expect(subject['_specifiersState'].identifiers).toContain(specifier);
        expect(result).not.toBe(specifier);
        expect(result.position).toBeUndefined();
        expect(result.tokens).toContain(token);
      });
    });
  });

  describe('handleIdentifier()', () => {
    let token: TSESTree.Token | TriviaToken;
    let specifier: Specifier;

    beforeEach(() => {
      specifier = new Specifier();
    });

    describe('when the token is a punctuator', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Punctuator
        });
      });

      describe('when the punctuator is a comma', () => {
        beforeEach(() => {
          token.value = Punctuator.Comma;
        });

        it('sets hasComma and position on the specifier', () => {
          subject['handleIdentifier'](specifier, token);

          expect(specifier.hasComma).toBe(true);
          expect(specifier.position).toBe(SpecifierPosition.After);
        });
      });

      describe('when the punctuator is anything else but a comma', () => {
        beforeEach(() => {
          token.value = Punctuator.Semicolon;
        });

        it('keeps the hasComma attribute to false', () => {
          subject['handleIdentifier'](specifier, token);

          expect(specifier.hasComma).toBe(false);
        });
      });
    });

    describe('when the token is anything else but a punctuator', () => {
      beforeEach(() => {
        token = double<TSESTree.Token>({
          type: TSESTree.AST_TOKEN_TYPES.Identifier
        });
      });

      it('registers the token inside the specifier', () => {
        subject['handleIdentifier'](specifier, token);

        expect(specifier.tokens).toContain(token);
      });
    });
  });

  describe('handleLastSpecifier()', () => {
    let specifier: Specifier;

    beforeEach(() => {
      specifier = new Specifier();
    });

    describe('when the specifier position is set to before', () => {
      beforeEach(() => {
        specifier.position = SpecifierPosition.Before;
        specifier.before = [double<TSESTree.Token>()];
      });

      it('copies the specifier "before" tokens in the specifiers state', () => {
        subject['handleLastSpecifier'](specifier);

        expect(subject['_specifiersState'].after).toBe(specifier.before);
      });
    });

    describe('when the specifier position is set to after', () => {
      beforeEach(() => {
        specifier.position = SpecifierPosition.After;
      });

      describe('when the last "after" token is undefined', () => {
        beforeEach(() => {
          specifier.after = [];
        });

        it('register the specifier into the identifiers', () => {
          subject['handleLastSpecifier'](specifier);

          expect(subject['_specifiersState'].identifiers).toContain(specifier);
        });
      });

      describe('when the last "after" token is a trivia space', () => {
        beforeEach(() => {
          specifier.after = [
            double<TriviaToken>({
              type: Trivia.Space
            })
          ];
        });

        it(`assigns an array with the specifier's last "after" element`, () => {
          const token = specifier.after.at(-1);
          subject['handleLastSpecifier'](specifier);

          expect(subject['_specifiersState'].after).toStrictEqual([token]);
        });
      });

      describe('when the last "after" token is anything else', () => {
        beforeEach(() => {
          specifier.after = [
            double<TriviaToken>({
              type: Trivia.Comma
            })
          ];
        });

        it('register the specifier into the identifiers', () => {
          subject['handleLastSpecifier'](specifier);

          expect(subject['_specifiersState'].identifiers).toContain(specifier);
        });
      });
    });

    describe('when the specifier has no position', () => {
      beforeEach(() => {
        specifier.position = undefined;
      });

      describe(`when the specifier doesn't have a newline`, () => {
        beforeEach(() => {
          specifier.tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            })
          ];
        });

        it('it returns no "after" element and registers the specifier into the state', () => {
          subject['handleLastSpecifier'](specifier);

          expect(specifier.after.length).toBe(0);
          expect(subject['_specifiersState'].identifiers).toContain(specifier);
        });
      });

      describe('when the specifier has a newline', () => {
        let newline: TriviaToken;

        beforeEach(() => {
          newline = double<TriviaToken>({
            type: Trivia.Newline,
            value: Character.Newline
          });
          specifier.tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            newline
          ];
        });

        it('registers the newline as an "after" element and the specifier', () => {
          subject['handleLastSpecifier'](specifier);

          expect(specifier.after).toContain(newline);
          expect(subject['_specifiersState'].identifiers).toContain(specifier);
        });
      });

      describe('when the specifier has a newline and a newline inside a comment block', () => {
        let newline: TriviaToken;
        let block: TSESTree.Token;

        beforeEach(() => {
          newline = double<TriviaToken>({
            type: Trivia.Newline,
            value: Character.Newline
          });
          block = double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Block,
            value: `/* Comment ${Character.Newline}`
          });
          specifier.tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            newline,
            block
          ];
        });

        it('registers the newline as an "after" element and the block accordingly', () => {
          subject['handleLastSpecifier'](specifier);

          expect(specifier.after).toContain(newline);
          expect(subject['_specifiersState'].after).toContain(block);
        });
      });

      describe('when the specifier has a newline inside a comment block', () => {
        let block: TSESTree.Token;

        beforeEach(() => {
          block = double<TSESTree.Token>({
            type: TSESTree.AST_TOKEN_TYPES.Block,
            value: `/* Comment ${Character.Newline}`
          });
          specifier.tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            block
          ];
        });

        it('registers the newline as an "after" element and the block accordingly', () => {
          subject['handleLastSpecifier'](specifier);

          expect(subject['_specifiersState'].after).toContain(block);
        });
      });

      describe('when the specifier has a trailing space', () => {
        let space: TriviaToken;

        beforeEach(() => {
          space = double<TriviaToken>({
            type: Trivia.Space
          });
          specifier.tokens = [
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            double<TSESTree.Token>({
              type: TSESTree.AST_TOKEN_TYPES.Identifier
            }),
            space
          ];
        });

        it('registers the space as an "after" element', () => {
          subject['handleLastSpecifier'](specifier);

          expect(specifier.after).toContain(space);
          expect(subject['_specifiersState'].after.length).toBe(0);
        });
      });
    });
  });

  describe('updateIdentifierNodes()', () => {
    let identifiers: Array<Specifier>;

    beforeEach(() => {
      subject = build();
      subject['_importSpecifiers'] = [
        double<TSESTree.ImportSpecifier>(),
        double<TSESTree.ImportSpecifier>()
      ];
      identifiers = [double<Specifier>(), double<Specifier>()];
    });

    it('maps the nodes on the identifiers', () => {
      const result = subject['updateIdentifierNodes'](identifiers);

      result.forEach((identifier, idx) => {
        expect(identifier.node).toBe(subject['_importSpecifiers'][idx]);
      });
    });
  });
});
