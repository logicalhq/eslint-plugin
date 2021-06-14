import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import { Character, NodeAndSourceCodeOptions } from 'lib/ast/interface';
import { tokenizeTrivia } from 'lib/utils/token.utils';

export enum CommentPosition {
  Before = 'before',
  After = 'after'
}

export interface RenderCommentOptions {
  comment: TSESTree.Comment;
  sourceCode: Readonly<TSESLint.SourceCode>;
  trivia: string;
  position: CommentPosition;
}

export interface RenderCommentsOptions extends NodeAndSourceCodeOptions {
  comments: Array<TSESTree.Comment>;
  position: CommentPosition;
}

export function renderComment({
  comment,
  sourceCode,
  trivia,
  position
}: RenderCommentOptions): string {
  const text = sourceCode.text.slice(comment.range[0], comment.range[1]);
  return position === CommentPosition.Before
    ? text.concat(
        tokenizeTrivia(trivia)
          .map(token => token.value)
          .join(Character.Empty)
      )
    : tokenizeTrivia(trivia)
        .map(token => token.value)
        .join(Character.Empty)
        .concat(text);
}

export function renderComments({
  node,
  sourceCode,
  comments,
  position
}: RenderCommentsOptions): string {
  return comments
    .map((comment: TSESTree.Comment, idx: number) => {
      let trivia: string;
      switch (position) {
        case CommentPosition.Before:
          trivia = sourceCode.text.slice(
            comment.range[1],
            (idx === comments.length - 1 ? node : comments[idx + 1]).range[0]
          );
          break;
        default:
          trivia = sourceCode.text.slice(
            (idx === 0 ? node : comments[idx - 1]).range[1],
            comment.range[0]
          );
          break;
      }
      return renderComment({ comment, sourceCode, trivia, position });
    })
    .join(Character.Empty);
}
