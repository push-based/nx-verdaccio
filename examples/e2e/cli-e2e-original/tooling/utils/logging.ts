import { bold, gray, red } from 'ansis';

export function info(message: string, token: string) {
  console.info(`${gray('>')} ${gray(bold(token))} ${message}`);
}
export function error(message: string, token: string) {
  console.error(`${red('>')} ${red(bold(token))} ${message}`);
}
