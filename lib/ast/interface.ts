import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

export type Chunk<T> = Array<T extends TSESTree.BaseNode ? T : TSESTree.Node>;

export enum Punctuator {
  OpenBrace = '{',
  CloseBrace = '}',
  OpenParen = '(',
  CloseParen = ')',
  OpenBracket = '[',
  CloseBracket = ']',
  Dot = '.',
  DotDotDot = '...',
  Semicolon = ';',
  Comma = ',',
  QuestionDot = '?.',
  LessThan = '<',
  LessThanSlash = '</',
  GreaterThan = '>',
  LessThanEquals = '<=',
  GreaterThanEquals = '>=',
  EqualsEquals = '==',
  ExclamationEquals = '!=',
  EqualsEqualsEquals = '===',
  ExclamationEqualsEquals = '!==',
  EqualsGreaterThan = '=>',
  Plus = '+',
  Minus = '-',
  Asterisk = '*',
  AsteriskAsterisk = '**',
  Slash = '/',
  Percent = '%',
  PlusPlus = '++',
  MinusMinus = '--',
  LessThanLessThan = '<<',
  GreaterThanGreaterThan = '>>',
  GreaterThanGreaterThanGreaterThan = '>>>',
  Ampersand = '&',
  Bar = '|',
  Caret = '^',
  Exclamation = '!',
  Tilde = '~',
  AmpersandAmpersand = '&&',
  BarBar = '||',
  Question = '?',
  Colon = ' =',
  At = '@',
  QuestionQuestion = '??',
  Backtick = '`',
  Equals = '=',
  PlusEquals = '+=',
  MinusEquals = '-=',
  AsteriskEquals = '*=',
  AsteriskAsteriskEquals = '**=',
  SlashEquals = '/=',
  PercentEquals = '%=',
  LessThanLessThanEquals = '<<=',
  GreaterThanGreaterThanEquals = '>>=',
  GreaterThanGreaterThanGreaterThanEquals = '>>>=',
  AmpersandEquals = '&=',
  BarEquals = '|=',
  BarBarEquals = '||=',
  AmpersandAmpersandEquals = '&&=',
  QuestionQuestionEquals = '??=',
  CaretEquals = '^='
}

export enum Character {
  Empty = '',
  Formfeed = '\f',
  Newline = '\n',
  Tab = '\t',
  VerticalTab = '\v',
  Space = ' '
}

export enum Trivia {
  Comma = 'Comma',
  Empty = 'Empty',
  Formfeed = 'Formfeed',
  Garbage = 'Garbage',
  Newline = 'Newline',
  Space = 'Space',
  Semicolon = 'Semicolon',
  Tab = 'Tab',
  VerticalTab = 'VerticalTab'
}

export const PATTERNS = {
  newline: /(\r?\n|[\r\n\u2028\u2029])/,
  space: /^(\s+)$/
};

export type TriviaToken =
  | { type: Trivia.Comma; value: Punctuator.Comma }
  | { type: Trivia.Empty; value: Character.Empty }
  | { type: Trivia.Formfeed; value: Character.Formfeed }
  | { type: Trivia.Garbage; value: string }
  | { type: Trivia.Newline; value: string }
  | { type: Trivia.Semicolon; value: string }
  | {
      type: Trivia.Space;
      value: string;
      occurences: number;
    }
  | { type: Trivia.Tab; value: Character.Tab }
  | { type: Trivia.VerticalTab; value: Character.VerticalTab };

export interface NodeAndSourceCodeOptions {
  node: TSESTree.Node;
  sourceCode: Readonly<TSESLint.SourceCode>;
}
