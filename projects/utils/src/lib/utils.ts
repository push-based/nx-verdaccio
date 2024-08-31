import {User} from "@nx-verdaccio-e2e-setup/models";

export function sortUser(users: User[]): User[] {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}
