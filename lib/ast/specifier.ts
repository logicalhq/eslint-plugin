import { TSESTree } from '@typescript-eslint/experimental-utils';

import { TriviaToken } from 'lib/ast/interface';

export enum SpecifierPosition {
  Before = 'before',
  After = 'after'
}

export class Specifier {
  public position: SpecifierPosition | undefined = SpecifierPosition.Before;

  public before: Array<TSESTree.Token | TriviaToken> = [];

  public after: Array<TSESTree.Token | TriviaToken> = [];

  public tokens: Array<TSESTree.Token | TriviaToken> = [];

  public node: TSESTree.ImportSpecifier;

  public hasComma = false;
}
