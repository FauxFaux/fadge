export type ExtractKey<T> = ((item: T) => number) | ((item: T) => string);

export function sortBy<T>(array: T[], ...keys: ExtractKey<T>[]): T[] {
  return array.sort((left, right) => {
    for (const key of keys) {
      const l = key(left);
      const r = key(right);
      if (l < r) {
        return -1;
      }
      if (l > r) {
        return 1;
      }
    }

    return 0;
  });
}

export function includesSubsequence<T>(array: T[], sequence: T[]): boolean {
  for (let i = 0; i < array.length - sequence.length; ++i) {
    if (startsWith(array.slice(i), sequence)) {
      return true;
    }
  }
  return false;
}

function startsWith<T>(array: T[], sequence: T[]): boolean {
  for (let i = 0; i < sequence.length; ++i) {
    if (array[i] !== sequence[i]) {
      return false;
    }
  }

  return true;
}
