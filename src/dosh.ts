import * as t from '@babel/types';
import { inspect } from 'node:util';
import { Node } from '@babel/types';

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

export function string(v: Node | undefined): string {
  if (t.isStringLiteral(v)) {
    return v.value;
  }
  throw new Error(`not a string: ${v?.type}: ${inspect(v)}`);
}

export function longestCommonPrefix(paths: string[]): string {
  let now = (paths[0] ?? '').split('/');

  for (const path of paths.slice(1)) {
    now = lcp2(now, path.split('/'));
    if (!now.length) {
      return '/';
    }
  }
  return now.join('/') + '/';
}

export function lcp2<T>(left: T[], right: T[]): T[] {
  let i = 0;
  while (i++ < left.length) {
    if (left[i] !== right[i]) break;
  }
  return left.slice(0, i);
}

export function stripPrefix(prefix: string, from: string) {
  if (from.startsWith(prefix)) {
    return from.substring(prefix.length);
  }
  return from;
}

export function invariant(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
