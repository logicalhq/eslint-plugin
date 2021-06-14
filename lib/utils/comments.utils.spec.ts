import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import {
  CommentPosition,
  renderComment,
  renderComments
} from 'lib/utils/comment.utils';
import { double } from 'test/utils/double.utils';

describe('renderComment()', () => {
  let comment: TSESTree.Comment;
  let position: CommentPosition;
  let sourceCode: TSESLint.SourceCode;
  const trivia = '  ';

  describe('when the comment is positioned before', () => {
    beforeEach(() => {
      position = CommentPosition.Before;
      sourceCode = double<TSESLint.SourceCode>({
        text: `/* comment */ let a = 'string';`
      });
      comment = double<TSESTree.Comment>({
        range: [0, 13]
      });
    });

    it('renders the comment and trivia', () => {
      expect(
        renderComment({
          comment,
          sourceCode,
          trivia,
          position
        })
      ).toEqual('/* comment */  ');
    });
  });

  describe('when the comment is positioned after', () => {
    beforeEach(() => {
      position = CommentPosition.After;
      sourceCode = double<TSESLint.SourceCode>({
        text: `let a = 'string'; /* comment */`
      });
      comment = double<TSESTree.Comment>({
        range: [18, 31]
      });
    });

    it('renders the comment and trivia', () => {
      expect(
        renderComment({
          comment,
          sourceCode,
          trivia,
          position
        })
      ).toEqual('  /* comment */');
    });
  });
});

describe('rendersComments()', () => {
  let node: TSESTree.Node;
  let comments: Array<TSESTree.Comment>;
  let position: CommentPosition;
  let sourceCode: TSESLint.SourceCode;

  describe('when comments are positioned before', () => {
    beforeEach(() => {
      position = CommentPosition.Before;
      comments = [
        double<TSESTree.Comment>({
          range: [0, 13]
        }),
        double<TSESTree.Comment>({
          range: [13, 35]
        })
      ];
      sourceCode = double<TSESLint.SourceCode>({
        text: `/* comment */ /* another-comment */ const b = () => {};`
      });
      node = double<TSESTree.Node>({
        range: [0, sourceCode.text.length]
      });
    });

    it('renders the comments collection', () => {
      expect(
        renderComments({ node, sourceCode, comments, position })
      ).toStrictEqual('/* comment */ /* another-comment */');
    });
  });

  describe('when comments are positioned after', () => {
    beforeEach(() => {
      position = CommentPosition.After;
      comments = [
        double<TSESTree.Comment>({
          range: [20, 33]
        }),
        double<TSESTree.Comment>({
          range: [34, 55]
        })
      ];
      sourceCode = double<TSESLint.SourceCode>({
        text: `const b = () => {}; /* comment */ /* another-comment */`
      });
      node = double<TSESTree.Node>({
        range: [0, sourceCode.text.length]
      });
    });

    it('renders the comments collection', () => {
      expect(
        renderComments({ node, sourceCode, comments, position })
      ).toStrictEqual('/* comment */ /* another-comment */');
    });
  });
});
