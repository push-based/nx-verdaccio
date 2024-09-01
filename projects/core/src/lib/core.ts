import {readFile, writeFile} from "node:fs/promises";
import {sortUser} from "@org/utils";
import {User} from "@org/models";

export async function sortUserFile(filePath: string): Promise<void> {
  const userJson: string = (await readFile(filePath)).toString();
  const sortedUsers: User[] = sortUser(JSON.parse(userJson));
  await writeFile(filePath, JSON.stringify(sortedUsers, null, 2));
}
