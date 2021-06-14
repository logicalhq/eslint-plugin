import { TSESTree } from '@typescript-eslint/experimental-utils';

import {
  Character,
  PATTERNS,
  Punctuator,
  Trivia,
  TriviaToken
} from 'lib/ast/interface';
import { NodeAndSourceCodeOptions } from 'lib/ast/interface';

export const TAIL_MAX_SEQUENCE = 5;

export function tokenizeTrivia(str: string): Array<TriviaToken> {
  let substrings = str.split(PATTERNS.newline);

  substrings =
    substrings.length >= TAIL_MAX_SEQUENCE
      ? substrings.slice(0, 2).concat(substrings.slice(-1))
      : substrings;

  return substrings
    .map((value: string): TriviaToken => {
      if (value.length === 0) {
        return { type: Trivia.Empty, value: Character.Empty };
      } else if (PATTERNS.newline.test(value)) {
        return { type: Trivia.Newline, value: Character.Newline };
      } else if (value === Punctuator.Comma) {
        return { type: Trivia.Comma, value };
      } else if (PATTERNS.space.test(value)) {
        return {
          type: Trivia.Space,
          value,
          occurences: value.length
        };
      }
      return { type: Trivia.Garbage, value };
    })
    .filter(
      token => token.type !== Trivia.Garbage && token.type !== Trivia.Empty
    );
}

export function tokenize({
  node,
  sourceCode
}: NodeAndSourceCodeOptions): Array<TSESTree.Token | TriviaToken> {
  return sourceCode
    .getTokens(node)
    .flatMap(
      (token: TSESTree.Token, idx: number, tokens: Array<TSESTree.Token>) => {
        if (idx === tokens.length - 1) return [token];

        const comments = sourceCode.getCommentsAfter(token);
        const last =
          comments.length > 0 ? (comments.at(-1) as TSESTree.Comment) : token;
        const nextToken = tokens[idx + 1];

        return [
          token,
          ...comments.flatMap((comment: TSESTree.Comment, cidx: number) => {
            const sibling = cidx === 0 ? token : comments[cidx - 1];
            return [
              ...tokenizeTrivia(
                sourceCode.text.slice(sibling.range[1], comment.range[0])
              ),
              {
                ...comment,
                value: sourceCode.text.slice(comment.range[0], comment.range[1])
              }
            ];
          }),
          ...tokenizeTrivia(
            sourceCode.text.slice(last.range[1], nextToken.range[0])
          )
        ];
      }
    );
}
