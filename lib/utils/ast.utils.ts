import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import {
  Character,
  Chunk,
  NodeAndSourceCodeOptions,
  PATTERNS,
  Trivia,
  TriviaToken
} from 'lib/ast/interface';

export interface ObtainLastLineOptions<T> {
  node: TSESTree.ImportDeclaration;
  idx: number;
  chunk: Chunk<T>;
}

export interface ObtainCommentsBeforeOptions extends NodeAndSourceCodeOptions {
  idx: number;
  lastLine: number;
}

export function obtainLastLine<T extends Array<TSESTree.BaseNode>>({
  node,
  idx,
  chunk
}: ObtainLastLineOptions<T>): number {
  if (idx === 0) return node.loc.start.line - 1;
  return chunk[idx - 1].loc.end.line;
}

export function obtainCommentsBefore({
  node,
  idx,
  sourceCode,
  lastLine
}: ObtainCommentsBeforeOptions): Array<TSESTree.Comment> {
  return sourceCode
    .getCommentsBefore(node)
    .filter((comment: TSESTree.Comment) => {
      return (
        comment.loc.start.line <= node.loc.start.line &&
        comment.loc.end.line > lastLine &&
        (idx > 0 || comment.loc.start.line > lastLine)
      );
    });
}

export function obtainCommentsAfter({
  node,
  sourceCode
}: NodeAndSourceCodeOptions): Array<TSESTree.Comment> {
  return sourceCode
    .getCommentsAfter(node)
    .filter(
      (comment: TSESTree.Comment) => comment.loc.end.line === node.loc.end.line
    );
}

export function obtainIndentation({
  node,
  sourceCode
}: NodeAndSourceCodeOptions): string {
  const tokenBefore = sourceCode.getTokenBefore(node, {
    includeComments: true
  });
  const lines = sourceCode.text
    .slice(tokenBefore === null ? 0 : tokenBefore.range[1], node.range[0])
    .split(PATTERNS.newline);

  if (tokenBefore === null) return lines.at(-1) as string;
  return lines.length > 1 ? (lines.at(-1) as string) : Character.Empty;
}

export function obtainNewline(
  sourceCode: Readonly<TSESLint.SourceCode>
): string {
  return PATTERNS.newline.exec(sourceCode.text)?.[0] ?? Character.Newline;
}

export function requiresHeadNewline(
  tokens: Array<TSESTree.Token | TriviaToken>
): boolean {
  const filtered = tokens.filter(token => token.type !== Trivia.Space);
  if (!filtered.length) return false;
  const [firstToken] = filtered;

  return (
    firstToken.type === TSESTree.AST_TOKEN_TYPES.Line ||
    (firstToken.type === TSESTree.AST_TOKEN_TYPES.Block &&
      PATTERNS.newline.test(firstToken.value))
  );
}
