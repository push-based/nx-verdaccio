import { User } from '@org/models';

export function sortUser(users: User[]): User[] {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}
