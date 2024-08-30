export function trimCharStart(str: string, char: string): string {
  if (str.startsWith(char)) {
    return str.slice(1);
  }
  return str;
}

export function trimCharEnd(str: string, char: string): string {
  if (str.endsWith(char)) {
    return str.slice(0, str.length - 1);
  }
  return str;
}
