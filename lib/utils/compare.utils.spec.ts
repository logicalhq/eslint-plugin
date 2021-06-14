import { compareString } from 'lib/utils/compare.utils';

describe('compareString()', () => {
  it('compares the two strings', () => {
    expect(compareString('a', 'z') > 0).toBe(false);
    expect(compareString('z', 'a') > 0).toBe(true);
    expect(compareString('Rick', 'morty') > 0).toBe(true);
    expect(compareString('aladin', 'alabama') > 0).toBe(true);
    expect(compareString('aladin', 'alakazam') > 0).toBe(false);
    expect(compareString('âge', 'age') > 0).toBe(true);
    expect(compareString('age', 'âge') < 0).toBe(true);
    expect(compareString('🤩', '😁') > 0).toBe(false);
    expect(compareString('_func', 'func') > 0).toBe(false);
    expect(compareString('éèêe', 'éèêe') === 0).toBe(true);
  });
});
