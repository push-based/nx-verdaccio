import { readFile, writeFile } from 'node:fs/promises';
import { sortUser } from '@push-based/utils';
import { parseUser, User } from '@push-based/models';

export async function sortUserFile(filePath: string): Promise<void> {
  const userJson: string = (await readFile(filePath)).toString();
  const sortedUsers: User[] = sortUser(JSON.parse(userJson)).map(parseUser);
  await writeFile(filePath, JSON.stringify(sortedUsers, null, 2));
}
