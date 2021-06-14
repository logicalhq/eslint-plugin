import { TSESTree } from '@typescript-eslint/experimental-utils';

import { AugmentedImportDeclaration } from 'lib/ast/declaration';
import { Specifier } from 'lib/ast/specifier';
import { StrategyOptions } from 'lib/strategies/interface';
import { LogicalStrategy } from 'lib/strategies/logical.strategy';
import { double } from 'test/utils/double.utils';
import { multiline } from 'test/utils/string.utils';

describe('LogicalStrategy', () => {
  let subject: LogicalStrategy;

  const build = (options?: StrategyOptions): LogicalStrategy => {
    return new LogicalStrategy({
      ...options
    });
  };

  beforeEach(() => {
    subject = build();
  });

  describe('get scopes()', () => {
    describe('when the strategy instance has no scopes', () => {
      it('returns an empty array', () => {
        expect(subject.scopes).toStrictEqual([]);
      });
    });

    describe('when the strategy instance has scopes', () => {
      beforeEach(() => {
        subject = build({
          scopes: ['@scope']
        });
      });

      it('returns its scopes', () => {
        expect(subject.scopes).toStrictEqual(['@scope']);
      });
    });
  });

  describe('hasScope()', () => {
    beforeEach(() => {
      subject = build({
        scopes: ['@scope']
      });
    });

    describe(`when the source doesn't have a scope`, () => {
      const source = 'fs';

      it('returns false', () => {
        expect(subject.hasScope(source)).toBe(false);
      });
    });

    describe('when the source has a scope', () => {
      const source = '@scope';

      it('returns true', () => {
        expect(subject.hasScope(source)).toBe(true);
      });
    });
  });

  describe('renderImports()', () => {
    const declarations = [
      double<AugmentedImportDeclaration>({
        source: 'fs',
        isSideEffect: () => false,
        hasSpecifiers: () => true,
        node: {
          importKind: 'value',
          source: {
            value: 'fs'
          }
        },
        segments: {
          commentsBefore: [],
          commentsAfter: [],
          indentation: ''
        },
        toString: () => `import fs from 'fs';`,
        idx: 1
      }),
      double<AugmentedImportDeclaration>({
        source: './local',
        isSideEffect: () => false,
        hasSpecifiers: () => true,
        node: {
          importKind: 'value',
          source: {
            value: './local'
          }
        },
        segments: {
          commentsBefore: [],
          commentsAfter: [],
          indentation: ''
        },
        toString: () => `import fs from './local';`,
        idx: 2
      }),
      double<AugmentedImportDeclaration>({
        source: 'foo',
        isSideEffect: () => false,
        hasSpecifiers: () => true,
        node: {
          importKind: 'value',
          source: {
            value: 'foo'
          }
        },
        segments: {
          commentsBefore: [],
          commentsAfter: [
            {
              type: TSESTree.AST_TOKEN_TYPES.Block,
              value: '/* comment */'
            }
          ],
          indentation: ''
        },
        toString: () => `import { qux } from 'foo';`,
        idx: 3
      }),
      double<AugmentedImportDeclaration>({
        source: 'bar',
        isSideEffect: () => false,
        hasSpecifiers: () => true,
        node: {
          importKind: 'value',
          source: {
            value: 'bar'
          }
        },
        segments: {
          commentsBefore: [],
          commentsAfter: [],
          indentation: ''
        },
        toString: () => `import { baz } from 'bar';`,
        idx: 4
      })
    ];

    it('renders sorted imports', () => {
      const rendered = subject.renderImports(declarations);

      expect(rendered).toBe(multiline`import fs from 'fs';
        import { baz } from 'bar';
        import { qux } from 'foo';


        import fs from './local';`);
    });

    it('renders a single declaration without any extra newlines', () => {
      const rendered = subject.renderImports([
        double<AugmentedImportDeclaration>({
          source: 'foo',
          isSideEffect: () => false,
          hasSpecifiers: () => true,
          node: {
            importKind: 'value',
            source: {
              value: 'foo'
            }
          },
          segments: {
            commentsBefore: [],
            commentsAfter: [
              {
                type: TSESTree.AST_TOKEN_TYPES.Block,
                value: '/* comment */'
              }
            ],
            indentation: ''
          },
          toString: () => `import { qux } from 'foo';`,
          idx: 0
        })
      ]);
      expect(rendered).toBe(`import { qux } from 'foo';`);
    });
  });

  describe('groupDeclarations()', () => {
    const declarations = [
      double<AugmentedImportDeclaration>({
        node: {
          importKind: 'value',
          source: {
            value: 'fs'
          }
        }
      }),
      double<AugmentedImportDeclaration>({
        node: {
          importKind: 'value',
          source: {
            value: './local.ts'
          }
        }
      }),
      double<AugmentedImportDeclaration>({
        node: {
          importKind: 'value',
          source: {
            value: 'react'
          }
        }
      }),
      double<AugmentedImportDeclaration>({
        node: {
          importKind: 'type',
          source: {
            value: '@a/foo'
          }
        }
      })
    ];

    beforeEach(() => {
      subject = build({
        scopes: ['@a']
      });
    });

    it('groups the declarations', () => {
      const groups = subject.groupDeclarations(declarations);

      expect(groups.builtin).toContain(declarations[0]);
      expect(groups.local).toContain(declarations[1]);
      expect(groups.local).toContain(declarations[3]);
      expect(groups.vendor).toContain(declarations[2]);
    });
  });

  describe('sortIdentifiers()', () => {
    describe('when both identifiers provides an imported name', () => {
      const identifiers = [
        double<Specifier>({
          node: {
            imported: { name: 'c' }
          }
        }),
        double<Specifier>({
          node: {
            imported: { name: 'b' }
          }
        }),
        double<Specifier>({
          node: {
            imported: { name: 'a' }
          }
        })
      ];

      it('sorts the identifiers by their node imported name', () => {
        const sorted = subject.sortIdentifiers(identifiers);

        expect(sorted[0]).toBe(identifiers[2]);
        expect(sorted[1]).toBe(identifiers[1]);
        expect(sorted[2]).toBe(identifiers[0]);
      });
    });

    describe('when both identifiers provides only a local name', () => {
      const identifiers = [
        double<Specifier>({
          node: {
            local: { name: 'c' }
          }
        }),
        double<Specifier>({
          node: {
            local: { name: 'a' }
          }
        }),
        double<Specifier>({
          node: {
            local: { name: 'b' }
          }
        })
      ];

      it('sorts the identifiers by their node imported name', () => {
        const sorted = subject.sortIdentifiers(identifiers);

        expect(sorted[0]).toBe(identifiers[1]);
        expect(sorted[1]).toBe(identifiers[2]);
        expect(sorted[2]).toBe(identifiers[0]);
      });
    });

    describe('when no imported or local values is present on the nodes', () => {
      const identifiers = [
        double<Specifier>({
          node: {}
        }),
        double<Specifier>({
          node: {}
        }),
        double<Specifier>({
          node: {}
        })
      ];

      it('sorts the identifiers by their node imported name', () => {
        const sorted = subject.sortIdentifiers(identifiers);

        expect(sorted[0]).toBe(identifiers[0]);
        expect(sorted[1]).toBe(identifiers[1]);
        expect(sorted[2]).toBe(identifiers[2]);
      });
    });
  });

  describe('sortDeclarations()', () => {
    const declarations: Array<AugmentedImportDeclaration> = [
      double<AugmentedImportDeclaration>({
        source: './baz',
        isSideEffect: () => true,
        idx: 0
      }),
      double<AugmentedImportDeclaration>({
        source: '@scope/foo',
        isSideEffect: () => false,
        hasSpecifiers: () => false,
        idx: 1
      }),
      double<AugmentedImportDeclaration>({
        source: 'bar',
        isSideEffect: () => false,
        hasSpecifiers: () => false,
        idx: 2
      }),
      double<AugmentedImportDeclaration>({
        source: 'qux',
        isSideEffect: () => false,
        hasSpecifiers: () => true,
        idx: 3
      }),
      double<AugmentedImportDeclaration>({
        source: 'foo',
        isSideEffect: () => false,
        hasSpecifiers: () => false,
        idx: 4
      }),
      double<AugmentedImportDeclaration>({
        source: 'foo',
        isSideEffect: () => false,
        hasSpecifiers: () => false,
        idx: 5
      })
    ];

    beforeEach(() => {
      subject = build({
        scopes: ['@scope']
      });
    });

    it('sorts the declarations based on their specificities', () => {
      const sorted = subject.sortDeclarations(declarations);

      expect(sorted[0]).toBe(declarations[2]);
      expect(sorted[1]).toBe(declarations[4]);
      expect(sorted[2]).toBe(declarations[5]);
      expect(sorted[3]).toBe(declarations[3]);
      expect(sorted[4]).toBe(declarations[1]);
      expect(sorted[5]).toBe(declarations[0]);
    });
  });

  describe('compareSideEffects()', () => {
    describe(`when one of the declaration isn't a side effect`, () => {
      const a = double<AugmentedImportDeclaration>({
        source: './bar',
        isSideEffect: () => true
      });
      const b = double<AugmentedImportDeclaration>({
        source: '@scope/bar',
        isSideEffect: () => false
      });

      it('returns the result of the side effect presence comparison', () => {
        expect(subject.compareSideEffects(a, b)).toBe(1);
      });
    });

    describe('when both declarations are side effects', () => {
      const a = double<AugmentedImportDeclaration>({
        source: './bar',
        isSideEffect: () => true
      });
      const b = double<AugmentedImportDeclaration>({
        source: './qux',
        isSideEffect: () => true
      });

      it('returns the result of the source comparison', () => {
        expect(subject.compareSideEffects(a, b)).toBe(-1);
      });
    });

    describe('when both declarations are identical', () => {
      const a = double<AugmentedImportDeclaration>({
        source: './bar',
        isSideEffect: () => true,
        idx: 1
      });
      const b = double<AugmentedImportDeclaration>({
        source: './bar',
        isSideEffect: () => true,
        idx: 2
      });

      it('returns the result of the index comparison', () => {
        expect(subject.compareSideEffects(a, b)).toBe(-1);
      });
    });
  });

  describe('compareScopes()', () => {
    describe(`when both scopes don't have the same position in the config array`, () => {
      const a = double<AugmentedImportDeclaration>({
        source: '@a/foo',
        hasSpecifiers: () => false
      });
      const b = double<AugmentedImportDeclaration>({
        source: '@b/bar',
        hasSpecifiers: () => false
      });

      describe('when a comes before b', () => {
        beforeEach(() => {
          subject = build({
            scopes: ['@a', '@b']
          });
        });

        it('returns -1', () => {
          expect(subject.compareScopes(a, b)).toBe(-1);
        });
      });

      describe('when b comes before a', () => {
        beforeEach(() => {
          subject = build({
            scopes: ['@b', '@a']
          });
        });

        it('returns 1', () => {
          expect(subject.compareScopes(a, b)).toBe(1);
        });
      });
    });

    describe('when both declarations have the same scope and source', () => {
      const a = double<AugmentedImportDeclaration>({
        source: '@a/foo',
        hasSpecifiers: () => true,
        idx: 1
      });
      const b = double<AugmentedImportDeclaration>({
        source: '@a/foo',
        hasSpecifiers: () => true,
        idx: 2
      });

      it('returns the result of the index comparison', () => {
        expect(subject.compareScopes(a, b)).toBe(-1);
      });
    });

    describe('when both declarations have the same scope but different sources', () => {
      const a = double<AugmentedImportDeclaration>({
        source: '@a/foo',
        hasSpecifiers: () => true
      });
      const b = double<AugmentedImportDeclaration>({
        source: '@a/bar',
        hasSpecifiers: () => true
      });

      it('returns the result of the source comparison', () => {
        expect(subject.compareScopes(a, b)).toBe(1);
      });
    });
  });

  describe('compareSpecifiers()', () => {
    describe(`when the declarations sources aren't identical`, () => {
      const a = double<AugmentedImportDeclaration>({
        source: 'a'
      });
      const b = double<AugmentedImportDeclaration>({
        source: 'b'
      });

      it('returns the result of the source comparison', () => {
        expect(subject.compareSpecifiers(a, b)).toBe(-1);
      });
    });

    describe('when only the first declaration has a specifier', () => {
      const a = double<AugmentedImportDeclaration>({
        source: 'a',
        hasSpecifiers: () => true
      });
      const b = double<AugmentedImportDeclaration>({
        source: 'a',
        hasSpecifiers: () => false
      });

      it('returns the result of the specifier presence comparison', () => {
        expect(subject.compareSpecifiers(a, b)).toBe(1);
      });
    });

    describe('otherwise both declaration indexes are compared', () => {
      const a = double<AugmentedImportDeclaration>({
        source: 'a',
        hasSpecifiers: () => true,
        idx: 1
      });
      const b = double<AugmentedImportDeclaration>({
        source: 'a',
        hasSpecifiers: () => true,
        idx: 2
      });

      it('returns the result of the index comparison', () => {
        expect(subject.compareSpecifiers(a, b)).toBe(-1);
      });
    });
  });

  describe('compareDeclaration()', () => {
    const a = double<AugmentedImportDeclaration>();
    const b = double<AugmentedImportDeclaration>();

    describe('when the condition for a and b returns the same value', () => {
      const condition = () => true;

      it('returns 0', () => {
        expect(subject.compareDeclaration(a, b, condition)).toBe(0);
      });
    });

    describe('when only the condition for a is true', () => {
      const condition = (declaration: AugmentedImportDeclaration): boolean =>
        declaration === a;

      it('returns 1', () => {
        expect(subject.compareDeclaration(a, b, condition)).toBe(1);
      });
    });

    describe('when only the condition for b is true', () => {
      const condition = (declaration: AugmentedImportDeclaration): boolean =>
        declaration === b;

      it('returns -1', () => {
        expect(subject.compareDeclaration(a, b, condition)).toBe(-1);
      });
    });
  });

  describe('compareDeclarationSource()', () => {
    describe(`when the two declarations don't have any @`, () => {
      describe('when a has an alphabetical precedence over b', () => {
        const a = double<AugmentedImportDeclaration>({
          source: 'a'
        });
        const b = double<AugmentedImportDeclaration>({
          source: 'b'
        });

        it('returns -1', () => {
          expect(subject.compareDeclarationSource(a, b)).toBe(-1);
        });
      });

      describe('when b has an alphabetical precedence over a', () => {
        const a = double<AugmentedImportDeclaration>({
          source: 'b'
        });
        const b = double<AugmentedImportDeclaration>({
          source: 'a'
        });

        it('returns 1', () => {
          expect(subject.compareDeclarationSource(a, b)).toBe(1);
        });
      });

      describe('when a and b are identical', () => {
        const a = double<AugmentedImportDeclaration>({
          source: 'a'
        });
        const b = double<AugmentedImportDeclaration>({
          source: 'a'
        });

        it('returns 0', () => {
          expect(subject.compareDeclarationSource(a, b)).toBe(0);
        });
      });
    });

    describe('when the first declaration has an @', () => {
      const a = double<AugmentedImportDeclaration>({
        source: '@a'
      });
      const b = double<AugmentedImportDeclaration>({
        source: 'a'
      });

      it('returns 1', () => {
        expect(subject.compareDeclarationSource(a, b)).toBe(1);
      });
    });

    describe('when the second declaration has an @', () => {
      const a = double<AugmentedImportDeclaration>({
        source: 'a'
      });
      const b = double<AugmentedImportDeclaration>({
        source: '@a'
      });

      it('returns -1', () => {
        expect(subject.compareDeclarationSource(a, b)).toBe(-1);
      });
    });
  });
});
