import { findLastIndex } from 'lib/utils/array.utils';

describe('findLastIndex()', () => {
  const array = [1, 2, 3, 4];

  describe(`when the predicate doesn't match anything`, () => {
    const predicate = () => false;

    it('returns -1', () => {
      expect(findLastIndex(array, predicate)).toBe(-1);
    });
  });

  describe('when the predicate match an array item', () => {
    const predicate = (item: number) => item === 2;

    it('returns 1', () => {
      expect(findLastIndex(array, predicate)).toBe(1);
    });
  });
});
