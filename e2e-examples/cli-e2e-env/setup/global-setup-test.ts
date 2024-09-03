import { writeFile } from 'node:fs/promises';

export async function setup() {
  await writeFile('tmp/setup.txt', 'Hello World from setup hook');
}

export async function teardown() {
  await writeFile('tmp/teardown.txt', 'Hello World from setup hook');
}
