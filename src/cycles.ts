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

interface MapBool {
  [key: string]: boolean;
}

export interface Dependencies {
  [filename: string]: string[];
}
