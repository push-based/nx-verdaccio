import { readFile, writeFile } from 'node:fs/promises';
import { parseUser, User } from '@push-based/models';

export async function sortDesc(filePath: string): Promise<void> {
  const userJson: string = (await readFile(filePath)).toString();
  const parsedUsers: User[] = JSON.parse(userJson).map(parseUser);
  const sortedUsers: User[] = parsedUsers.sort((a, b) =>
    b.name.localeCompare(a.name)
  );
  await writeFile(filePath, JSON.stringify(sortedUsers, null, 2));
}

export default sortDesc;
