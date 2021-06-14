import { AugmentedImportDeclaration } from 'lib/ast/declaration';
import { Specifier } from 'lib/ast/specifier';

export interface StrategyOptions {
  scopes?: string[];
}

export type StrategyClass<Interface> = new (
  options: StrategyOptions
) => Interface;

export interface ImportsStrategy {
  renderImports(declarations: Array<AugmentedImportDeclaration>): string;
  sortIdentifiers(identifiers: Array<Specifier>): Array<Specifier>;
}
