import { sortUser } from './utils';

describe('sortUser', () => {
  it('should sort a list of users', () => {
    expect(sortUser([{ name: 'Michael' }, { name: 'Alice' }])).toEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
