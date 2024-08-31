export type User = { name: string };

export function parseUser(obj: Record<string, unknown>): User {
  const parsedUser = Object.fromEntries(
    Object.entries(obj).filter(([key]) => key === 'name')
  );

  if (!('name' in parsedUser)) {
    throw new Error('Invalid user. Name is missing.');
  }

  return parsedUser as User;
}
