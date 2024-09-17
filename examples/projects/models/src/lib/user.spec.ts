import { parseUser } from './user';

describe('parseUser', () => {
  it('should parse valid user', () => {
    expect(parseUser({ name: 'Michael', color: 'Hotpink' })).toEqual({
      name: 'Michael',
    });
  });
  it('should parse valid user', () => {
    expect(() => parseUser({ color: 'Hotpink' })).toThrow(
      'Invalid user. Name is missing.'
    );
  });
});
