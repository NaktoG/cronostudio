let counter = 0;

export function makeTestId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}
