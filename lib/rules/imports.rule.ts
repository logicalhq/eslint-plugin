// A rule that sorts the imports by following an imports strategy.
// Some types are added explicitly for better readability and maintainability.

import { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils';

import { AugmentedImportDeclaration } from 'lib/ast/declaration';
import { Chunk, Punctuator } from 'lib/ast/interface';
import { ImportsStrategy, StrategyClass } from 'lib/strategies/interface';
import { LogicalStrategy } from 'lib/strategies/logical.strategy';
import { createRule } from 'lib/utils/rule.utils';

export type MessageId = 'imports';

export type Options = [{ strategy?: string; scopes?: string[] }];

export interface InspectImportOrderOptions {
  program: TSESTree.Program;
  context: Readonly<TSESLint.RuleContext<MessageId, Options>>;
  strategy?: string;
  scopes?: string[];
}

export const DefaultStrategy = 'logical';

export const Strategies = new Map<string, StrategyClass<ImportsStrategy>>([
  ['logical', LogicalStrategy]
]);

export function extractChunks(
  program: TSESTree.Program
): Array<Chunk<TSESTree.ImportDeclaration>> {
  const chunks: Array<Chunk<TSESTree.ImportDeclaration>> = [];
  let currentChunk = [];

  for (const node of program.body) {
    if (node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration) {
      currentChunk.push(node);
    } else if (currentChunk.length) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  }

  if (currentChunk.length) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function inspect(
  chunk: Chunk<TSESTree.ImportDeclaration>,
  {
    program,
    context,
    strategy: strategyName,
    scopes
  }: InspectImportOrderOptions
): void {
  if (!strategyName) {
    throw new Error(
      `Cannot find "${strategyName}" strategy, available strategies: ${[
        ...Strategies.keys()
      ].join(Punctuator.Semicolon)}.`
    );
  }

  const StrategyClass = Strategies.get(strategyName);
  if (!StrategyClass) {
    throw new Error(
      `No associated constructor associated with ${strategyName} strategy.`
    );
  }

  const strategy = new StrategyClass({ scopes });
  if (!strategy.renderImports || !strategy.sortIdentifiers) {
    throw new Error(
      `Strategy "${strategyName}" doesn't implement the ImportsStrategy interface.`
    );
  }

  if (!chunk.length) {
    return;
  }

  const sourceCode = context.getSourceCode();
  const declarations = chunk.map(
    (node, idx): AugmentedImportDeclaration =>
      new AugmentedImportDeclaration({
        node,
        idx,
        sourceCode,
        chunk,
        strategy
      })
  );

  let [start] = chunk[0].range;
  let [, end] = (chunk.at(-1) as TSESTree.ImportDeclaration).range;

  for (const comment of program.comments ?? []) {
    const [cstart, cend] = comment.range;
    switch (comment.type) {
      case TSESTree.AST_TOKEN_TYPES.Block:
        if (
          comment.loc.start.line ===
          (chunk.at(-1) as TSESTree.ImportDeclaration).loc.start.line
        ) {
          start = cstart < start ? cstart : start;
        }

        if (
          comment.loc.end.line === comment.loc.start.line &&
          comment.loc.end.line ===
            (chunk.at(-1) as TSESTree.ImportDeclaration).loc.end.line
        ) {
          end = cend > end ? cend : end;
        }
        break;

      case TSESTree.AST_TOKEN_TYPES.Line:
        if (
          comment.loc.end.line !==
          (chunk.at(-1) as TSESTree.ImportDeclaration).loc.end.line
        ) {
          continue;
        }
        end = cend > end ? cend : end;
        break;
    }
  }

  const sorted = strategy.renderImports(declarations);

  if (sourceCode.getText().slice(start, end) === sorted) {
    return;
  }

  context.report({
    messageId: 'imports',
    loc: {
      start: sourceCode.getLocFromIndex(start),
      end: sourceCode.getLocFromIndex(end)
    },
    fix: fixer => fixer.replaceTextRange([start, end], sorted)
  });
}

export default createRule<Options, MessageId>({
  name: 'imports',
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforces a consistent imports order.',
      recommended: false
    },
    fixable: 'code',
    schema: {
      type: 'array',
      definitions: {
        strategy: {
          enum: [...Strategies.keys()]
        }
      },
      items: [
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            strategy: {
              description: `Strategy used to sort imports (available: ${[
                ...Strategies.keys()
              ].join(',')}).`,
              oneOf: [{ $ref: '#/definitions/strategy' }, { type: 'object' }]
            },
            scopes: {}
          }
        }
      ]
    },
    messages: {
      imports: `Import order is inconsistent (use --fix to re-order).`
    }
  },
  defaultOptions: [
    {
      strategy: DefaultStrategy,
      scopes: []
    }
  ],
  create(
    context: Readonly<TSESLint.RuleContext<MessageId, Options>>,
    [options]: Readonly<Options>
  ): TSESLint.RuleListener {
    return {
      Program: (program: TSESTree.Program): void => {
        for (const chunk of extractChunks(program)) {
          inspect(chunk, { program, context, ...options });
        }
      }
    };
  }
});
