import { includesSubsequence } from './dosh';

function getPath(parent: string, unresolved: MapBool): string[] {
  let parentVisited = false;

  return Object.keys(unresolved).filter((module) => {
    if (module === parent) {
      parentVisited = true;
    }
    return parentVisited && unresolved[module];
  });
}

/**
 * A circular dependency is occurring when we see a software package
 * more than once, unless that software package has all its dependencies resolved.
 */
function resolver(
  id: string,
  modules: Dependencies,
  circular: string[][],
  resolved: MapBool,
  unresolved: MapBool,
) {
  unresolved[id] = true;

  for (const dependency of modules[id] ?? []) {
    if (resolved[dependency]) {
      continue;
    }
    if (unresolved[dependency]) {
      circular.push(getPath(dependency, unresolved));
      continue;
    }
    resolver(dependency, modules, circular, resolved, unresolved);
  }

  resolved[id] = true;
  unresolved[id] = false;
}

/**
 * Finds all circular dependencies for the given modules.
 * @param  {Object} modules
 * @return {Array}
 */
export function circularDependencies(modules: Dependencies): string[][] {
  const circular: string[][] = [];
  const resolved = {};
  const unresolved = {};

  for (const id of Object.keys(modules)) {
    resolver(id, modules, circular, resolved, unresolved);
  }

  return circular;
}

export function removeDuplicateCycles(problems: string[][]) {
  for (let i = problems.length - 1; i > 0; --i) {
    const us = problems[i];
    if (alreadyCovered(us, problems.slice(0, i - 1))) {
      problems.splice(i, 1);
    }
  }
}

function alreadyCovered(problem: string[], others: string[][]): boolean {
  for (const other of others) {
    if (includesSubsequence(problem, other)) {
      return true;
    }
  }

  return false;
}

interface MapBool {
  [key: string]: boolean;
}

export interface Dependencies {
  [filename: string]: string[];
}
