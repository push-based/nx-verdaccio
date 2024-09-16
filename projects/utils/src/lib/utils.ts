import {User} from "@push-based/models";

export function sortUser(users: User[]): User[] {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}
