import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import {
  Character,
  Chunk,
  PATTERNS,
  Punctuator,
  Trivia,
  TriviaToken
} from 'lib/ast/interface';
import { Specifier, SpecifierPosition } from 'lib/ast/specifier';
import { ImportsStrategy } from 'lib/strategies/interface';
import { findLastIndex } from 'lib/utils/array.utils';
import {
  obtainCommentsAfter,
  obtainCommentsBefore,
  obtainIndentation,
  obtainLastLine,
  requiresHeadNewline
} from 'lib/utils/ast.utils';
import { CommentPosition, renderComments } from 'lib/utils/comment.utils';
import { tokenize } from 'lib/utils/token.utils';

export interface ImportSegments {
  commentsBefore: Array<TSESTree.Comment>;
  commentsAfter: Array<TSESTree.Comment>;
  indentation: string;
}

export interface SpecifiersState {
  before: Array<TSESTree.Token | TriviaToken>;
  after: Array<TSESTree.Token | TriviaToken>;
  identifiers: Array<Specifier>;
}

export interface AugmentedImportDeclarationOptions {
  node: Readonly<TSESTree.ImportDeclaration>;
  idx: Readonly<number>;
  sourceCode: Readonly<TSESLint.SourceCode>;
  chunk: Chunk<TSESTree.ImportDeclaration>;
  strategy: ImportsStrategy;
}

//
// From: https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#prod-ImportDeclaration
//
// ▽─ ─ ─ ─ ─ ─ ─ Import Declaration ─ ─ ─ ─ ─ ─ ─ ─▽
// ▽─ ─ ─ ─ Import Clause ─ ─ ─ ─▽ ▽─ From Clause- ─▽
//          ▽─ ─ Imports List ─ ─▽
//                  ▼ Specifier ▼
// ┌────────────────────────────────────────────────┐
// │ import { lexer, tree as AST } from 'carthage'; │
// └────────────────────────────────────────────────┘
//     ▼─ Identifier ─▼     ▽ ─ ─ ─ ─ Binding ─ ─ ─ ─ ▽
// ┌─────────────────────────────────────────────────────┐
// │ { ImportDeclaration as AugmentedImportDeclaration } │
// └─────────────────────────────────────────────────────┘
//          ▼▼▼▼▼▼▼▼▼ SpecifierTokens  ▼ TriviaTokens
// ┌─────────────────────────────────────┐
// │ import { lexer } from 'carthage';\n │
// └─────────────────────────────────────┘
//
export class AugmentedImportDeclaration {
  protected _braceTokenRange!: [number, number];

  protected _importSpecifiers!: Array<TSESTree.ImportSpecifier>;

  protected _value!: string;

  protected _tokens!: Array<TSESTree.Token | TriviaToken>;

  protected _importSpecifierTokens!: Array<TSESTree.Token | TriviaToken>;

  protected _specifiersState: SpecifiersState = {
    before: [],
    after: [],
    identifiers: []
  };

  protected _segments!: ImportSegments;

  public constructor(
    public readonly options: AugmentedImportDeclarationOptions
  ) {}

  public get node(): Readonly<TSESTree.ImportDeclaration> {
    return this.options.node;
  }

  public get sourceCode(): Readonly<TSESLint.SourceCode> {
    return this.options.sourceCode;
  }

  public get idx(): Readonly<number> {
    return this.options.idx;
  }

  public get source(): Readonly<string> {
    return (
      this.node.source.value ??
      (this.node.source as unknown as Record<string, unknown>).name
    );
  }

  public get segments(): ImportSegments {
    const { node, idx, sourceCode, chunk } = this.options;
    return (this._segments ??= {
      commentsBefore: obtainCommentsBefore({
        node,
        idx,
        sourceCode,
        lastLine: obtainLastLine({
          node,
          idx,
          chunk
        })
      }),
      commentsAfter: obtainCommentsAfter({
        node,
        sourceCode
      }),
      indentation: obtainIndentation({
        node,
        sourceCode
      })
    });
  }

  public get tokens(): Array<TSESTree.Token | TriviaToken> {
    const { node, sourceCode } = this;
    return (this._tokens ??= tokenize({ node, sourceCode }));
  }

  public get importClauses(): Array<TSESTree.ImportClause> {
    return this.node.specifiers;
  }

  public get importSpecifiers(): Array<TSESTree.ImportSpecifier> {
    return (this._importSpecifiers ??= this.importClauses.filter(
      clause => clause.type === TSESTree.AST_NODE_TYPES.ImportSpecifier
    ) as Array<TSESTree.ImportSpecifier>);
  }

  public get braceTokenRange(): [number, number] {
    return (this._braceTokenRange ??= [
      this.tokens.findIndex(
        token =>
          token.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
          token.value === Punctuator.OpenBrace
      ),
      this.tokens.findIndex(
        token =>
          token.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
          token.value === Punctuator.CloseBrace
      )
    ]);
  }

  public get importSpecifierTokens(): Array<TSESTree.Token | TriviaToken> {
    return this.tokens.slice(
      this.braceTokenRange[0] + 1,
      this.braceTokenRange[1]
    );
  }

  public get specifiersState(): SpecifiersState {
    if (this._specifiersState.identifiers.length) {
      return this._specifiersState;
    }

    let specifier = new Specifier();
    this.importSpecifierTokens.forEach(token => {
      switch (specifier.position) {
        case SpecifierPosition.Before:
          specifier = this.handleBeforeIdentifier(specifier, token);
          break;

        case SpecifierPosition.After:
          specifier = this.handleAfterIdentifier(specifier, token);
          break;

        default:
          this.handleIdentifier(specifier, token);
      }
    });

    this.handleLastSpecifier(specifier);
    this._specifiersState.identifiers = this.updateIdentifierNodes(
      this._specifiersState.identifiers
    );

    return this._specifiersState;
  }

  public hasSpecifiers(): boolean {
    return (
      !this.braceTokenRange.includes(-1) && this.importSpecifiers.length >= 1
    );
  }

  public isSideEffect(): boolean {
    return (
      !this.importClauses.length &&
      (!this.node.importKind || this.node.importKind === 'value') &&
      this.sourceCode.getFirstToken(this.node, { skip: 1 })?.value !==
        Punctuator.OpenBrace
    );
  }

  public renderTokens(): string {
    const lastToken = this.tokens[this.tokens.length - 1];

    const hasSemicolon =
      lastToken &&
      lastToken.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
      lastToken.value === Punctuator.Semicolon;

    const tokens = hasSemicolon
      ? this.tokens
      : [
          ...this.tokens,
          { type: Trivia.Semicolon, value: Punctuator.Semicolon }
        ];

    return tokens.map(token => token.value).join(Character.Empty);
  }

  public renderNode(): string {
    if (!this.hasSpecifiers()) return this.renderTokens();

    const lastSpecifierToken = this.sourceCode.getTokenBefore(
      this.tokens[this.braceTokenRange[1]] as TSESTree.Token
    );

    const hasTrailingComma =
      lastSpecifierToken?.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
      lastSpecifierToken.value === Punctuator.Comma;

    const {
      identifiers,
      before: beforeIdentifiers,
      after: afterIdentifiers
    } = this.specifiersState;

    const sortedIdentifiers = this.options.strategy
      .sortIdentifiers(identifiers)
      .flatMap((identifier, idx, array) => {
        const previous = array[idx - 1];

        const headNewline =
          previous &&
          requiresHeadNewline(identifier.before) &&
          !(
            previous.after.length &&
            previous.after[previous.after.length - 1].type === Trivia.Newline
          )
            ? [{ type: Trivia.Newline, value: Character.Newline }]
            : [];

        if (
          identifiers.findIndex(id => id === identifier) === 0 &&
          requiresHeadNewline(beforeIdentifiers)
        ) {
          headNewline.push({ type: Trivia.Newline, value: Character.Newline });
        }

        let after = requiresHeadNewline(beforeIdentifiers)
          ? identifier.after.filter(id => id.type !== Trivia.Space).length
            ? identifier.after
            : []
          : identifier.after;

        if (identifier.hasComma) {
          const nonblankPredicate = (token: TSESTree.Token | TriviaToken) =>
            token.type !== Trivia.Newline && token.type !== Trivia.Space;
          let firstNonblankIdx =
            idx < array.length - 1 || hasTrailingComma
              ? -1
              : after.findIndex(nonblankPredicate);
          firstNonblankIdx = firstNonblankIdx === -1 ? 0 : firstNonblankIdx;
          const lastNonblankIdx = findLastIndex(after, nonblankPredicate);

          if (lastNonblankIdx === -1) {
            after = after.slice(firstNonblankIdx);
          } else if (
            after
              .slice(lastNonblankIdx + 1)
              .filter(token => token.type !== Trivia.Space).length
          ) {
            after = after.slice(firstNonblankIdx);
          } else {
            after = after.slice(firstNonblankIdx, lastNonblankIdx + 1);
          }
        }

        return [
          ...headNewline,
          ...identifier.before,
          ...identifier.tokens,
          ...(idx < array.length - 1 || hasTrailingComma
            ? [{ type: Trivia.Comma, value: Punctuator.Comma }]
            : []),
          ...after
        ];
      });

    const tokens = [
      ...this.tokens.slice(0, this.braceTokenRange[0] + 1),
      ...beforeIdentifiers,
      ...sortedIdentifiers,
      ...(requiresHeadNewline(afterIdentifiers) &&
      sortedIdentifiers[sortedIdentifiers.length - 1].type !== Trivia.Newline
        ? [{ type: Trivia.Newline, value: Character.Newline }]
        : []),
      ...afterIdentifiers,
      ...this.tokens.slice(this.braceTokenRange[1])
    ];

    const lastToken = tokens[tokens.length - 1];
    const hasSemicolon =
      lastToken.type === TSESTree.AST_TOKEN_TYPES.Punctuator &&
      lastToken.value === Punctuator.Semicolon;

    if (!hasSemicolon) {
      tokens.push({
        type: Trivia.Semicolon,
        value: Punctuator.Semicolon
      });
    }

    return tokens.map(token => token.value).join(Character.Empty);
  }

  public toString(): string {
    const { node, sourceCode } = this;
    const { indentation } = this.segments;

    return (this._value ??= String().concat(
      indentation,
      renderComments({
        node,
        sourceCode,
        comments: this.segments.commentsBefore,
        position: CommentPosition.Before
      }),
      this.renderNode(),
      renderComments({
        node,
        sourceCode,
        comments: this.segments.commentsAfter,
        position: CommentPosition.After
      })
    ));
  }

  protected handleBeforeIdentifier(
    specifier: Specifier,
    token: TSESTree.Token | TriviaToken
  ): Specifier {
    switch (token.type) {
      case Trivia.Newline:
        specifier.before.push(token);
        if (
          !this._specifiersState.before.length &&
          !this._specifiersState.identifiers.length
        ) {
          this._specifiersState.before = specifier.before;
          specifier = new Specifier();
        }
        break;

      case Trivia.Space:
      case TSESTree.AST_TOKEN_TYPES.Block:
      case TSESTree.AST_TOKEN_TYPES.Line:
        specifier.before.push(token);
        break;

      case TSESTree.AST_TOKEN_TYPES.Identifier:
        if (
          !this._specifiersState.before.length &&
          !this._specifiersState.identifiers.length
        ) {
          this._specifiersState.before = specifier.before;
          specifier = new Specifier();
        }
        specifier.position = undefined;
        specifier.tokens.push(token);
    }

    return specifier;
  }

  protected handleAfterIdentifier(
    specifier: Specifier,
    token: TSESTree.Token | TriviaToken
  ): Specifier {
    switch (token.type) {
      case Trivia.Newline:
        specifier.after.push(token);
        this._specifiersState.identifiers.push(specifier);
        specifier = new Specifier();
        break;

      case Trivia.Space:
      case TSESTree.AST_TOKEN_TYPES.Line:
        specifier.after.push(token);
        break;

      case TSESTree.AST_TOKEN_TYPES.Block:
        if (PATTERNS.newline.test(token.value)) {
          this._specifiersState.identifiers.push(specifier);
          specifier = new Specifier();
          specifier.before.push(token);
        } else {
          specifier.after.push(token);
        }
        break;

      case TSESTree.AST_TOKEN_TYPES.Identifier:
        this._specifiersState.identifiers.push(specifier);
        specifier = new Specifier();
        specifier.position = undefined;
        specifier.tokens.push(token);
        break;
    }

    return specifier;
  }

  protected handleIdentifier(
    specifier: Specifier,
    token: TSESTree.Token | TriviaToken
  ): void {
    switch (token.type) {
      case TSESTree.AST_TOKEN_TYPES.Punctuator:
        if (token.value === Punctuator.Comma) {
          specifier.hasComma = true;
          specifier.position = SpecifierPosition.After;
        }
        break;

      default:
        specifier.tokens.push(token);
    }
  }

  protected handleLastSpecifier(specifier: Specifier): void {
    switch (specifier.position) {
      case SpecifierPosition.Before:
        this._specifiersState.after = specifier.before;
        break;

      case SpecifierPosition.After:
        if (specifier.after.at(-1)?.type === Trivia.Space) {
          this._specifiersState.after = [
            specifier.after.pop() as TSESTree.Token | TriviaToken
          ];
        }
        this._specifiersState.identifiers.push(specifier);
        break;

      default:
        const lastIdentifierIdx = findLastIndex(
          specifier.tokens,
          token =>
            token.type === TSESTree.AST_TOKEN_TYPES.Identifier ||
            token.type === TSESTree.AST_TOKEN_TYPES.Keyword
        );

        const tokens = specifier.tokens.slice(0, lastIdentifierIdx + 1);
        const after = specifier.tokens.slice(lastIdentifierIdx + 1);

        let newlineIdx = after.findIndex(t => t.type === Trivia.Newline);

        if (newlineIdx !== -1) newlineIdx += 1;

        const blockIdx = after.findIndex(
          t =>
            t.type === TSESTree.AST_TOKEN_TYPES.Block &&
            PATTERNS.newline.test(t.value)
        );

        let sliceIdx = -1;

        if (newlineIdx >= 0 && blockIdx >= 0) {
          sliceIdx = Math.min(newlineIdx, blockIdx);
        } else if (newlineIdx >= 0) {
          sliceIdx = newlineIdx;
        } else if (blockIdx >= 0) {
          sliceIdx = blockIdx;
        } else if (after.at(-1)?.type === Trivia.Space) {
          sliceIdx = after.length;
        }

        specifier.tokens = tokens;
        specifier.after = sliceIdx === -1 ? after : after.slice(0, sliceIdx);
        this._specifiersState.identifiers.push(specifier);
        this._specifiersState.after =
          sliceIdx === -1 ? [] : after.slice(sliceIdx);
    }
  }

  protected updateIdentifierNodes(
    identifiers: Array<Specifier>
  ): Array<Specifier> {
    return identifiers.map((identifier, idx) => {
      identifier.node = this.importSpecifiers[idx];
      return identifier;
    });
  }
}
