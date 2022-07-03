import { AugmentedImportDeclaration } from 'lib/ast/declaration';
import { Character, Punctuator } from 'lib/ast/interface';
import { Specifier } from 'lib/ast/specifier';
import { ImportsStrategy, StrategyOptions } from 'lib/strategies/interface';
import { findLastIndex } from 'lib/utils/array.utils';
import { compareString } from 'lib/utils/compare.utils';

/* istanbul ignore next */
export const builtin = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib'
];

export class LogicalStrategy implements ImportsStrategy {
  public constructor(protected options: StrategyOptions) {}

  public get scopes(): string[] {
    return this.options.scopes ?? [];
  }

  public hasScope(source: string): boolean {
    return this.scopes.map(scope => source.startsWith(scope)).includes(true);
  }

  public renderImports(
    declarations: Array<AugmentedImportDeclaration>
  ): string {
    const rendered = Object.fromEntries(
      Object.entries(this.groupDeclarations(declarations)).map(
        ([name, group]) => {
          const sorted = this.sortDeclarations(group);
          const requiresNewline =
            !group.at(-1)?.segments.commentsAfter.length &&
            sorted.at(-1)?.segments.commentsAfter.length;
          const declarations = group.length
            ? sorted
                .map(declaration => declaration.toString())
                .join(Character.Newline)
                .concat(requiresNewline ? Character.Newline : Character.Empty)
            : Character.Empty;

          return [name, declarations];
        }
      )
    );

    return String().concat(
      rendered.builtin,
      rendered.builtin.length && rendered.vendor.length
        ? Character.Newline
        : Character.Empty,
      rendered.vendor,
      (rendered.builtin.length || rendered.vendor.length) &&
        rendered.local.length
        ? Character.Newline.repeat(2)
        : Character.Empty,
      rendered.local
    );
  }

  public groupDeclarations(
    declarations: Array<AugmentedImportDeclaration>
  ): Record<string, Array<AugmentedImportDeclaration>> {
    const groups: Record<string, Array<AugmentedImportDeclaration>> = {
      builtin: [],
      vendor: [],
      local: []
    };

    for (const declaration of declarations) {
      switch (declaration.node.importKind) {
        case 'type':
        case 'value':
          const source = declaration.node.source.value as string;
          if (builtin.includes(source)) {
            groups.builtin.push(declaration);
          } else if (
            source.charAt(0) === Punctuator.Dot ||
            this.hasScope(source)
          ) {
            groups.local.push(declaration);
          } else {
            groups.vendor.push(declaration);
          }
          break;
      }
    }

    return groups;
  }

  public sortIdentifiers(identifiers: Array<Specifier>): Array<Specifier> {
    return identifiers
      .slice()
      .sort(
        ({ node: a }, { node: b }) =>
          compareString(a.imported?.name, b.imported?.name) ||
          compareString(a.local?.name, b.local?.name)
      );
  }

  public sortDeclarations(
    declarations: Array<AugmentedImportDeclaration>
  ): Array<AugmentedImportDeclaration> {
    return declarations.slice().sort((a, b) => {
      if (a.isSideEffect() || b.isSideEffect()) {
        return this.compareSideEffects(a, b);
      } else if (this.hasScope(a.source) || this.hasScope(b.source)) {
        return this.compareScopes(a, b);
      } else if (a.hasSpecifiers() || b.hasSpecifiers()) {
        return this.compareSpecifiers(a, b);
      }

      const result = this.compareDeclarationSource(a, b);
      return result === 0 ? a.idx - b.idx : result;
    });
  }

  public compareSideEffects(
    a: AugmentedImportDeclaration,
    b: AugmentedImportDeclaration
  ): number {
    let result = this.compareDeclaration(a, b, declaration =>
      declaration.isSideEffect()
    );
    if (result !== 0) return result;

    result = this.compareDeclarationSource(a, b);
    return result === 0 ? a.idx - b.idx : result;
  }

  public compareScopes(
    a: AugmentedImportDeclaration,
    b: AugmentedImportDeclaration
  ): number {
    const pos = {
      a: findLastIndex(this.scopes, scope => a.source.startsWith(scope)),
      b: findLastIndex(this.scopes, scope => b.source.startsWith(scope))
    };

    if (pos.a === pos.b) {
      const result = this.compareDeclarationSource(a, b);
      return result === 0 ? a.idx - b.idx : result;
    }

    return pos.a < pos.b ? -1 : 1;
  }

  public compareSpecifiers(
    a: AugmentedImportDeclaration,
    b: AugmentedImportDeclaration
  ): number {
    let result = this.compareDeclarationSource(a, b);
    if (result !== 0) return result;

    result = this.compareDeclaration(a, b, declaration =>
      declaration.hasSpecifiers()
    );
    if (result !== 0) return result;

    return a.idx - b.idx;
  }

  public compareDeclaration(
    a: AugmentedImportDeclaration,
    b: AugmentedImportDeclaration,
    condition: (declaration: AugmentedImportDeclaration) => boolean
  ): number {
    if (condition(a) && condition(b)) return 0;
    return condition(a) ? 1 : -1;
  }

  public compareDeclarationSource(
    a: AugmentedImportDeclaration,
    b: AugmentedImportDeclaration
  ): number {
    if (
      a.source.charAt(0) === Punctuator.At &&
      b.source.charAt(0) !== Punctuator.At
    ) {
      return 1;
    }

    if (
      a.source.charAt(0) !== Punctuator.At &&
      b.source.charAt(0) === Punctuator.At
    ) {
      return -1;
    }

    return compareString(a.source, b.source);
  }
}
