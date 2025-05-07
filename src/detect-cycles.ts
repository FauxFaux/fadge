import * as path from 'path';
import { longestCommonPrefix, stripPrefix } from './dosh.js';
import { dependenciesForPaths } from './dependencies.js';
import { circularDependencies, cleanupCircularDependencies } from './cycles.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
import fg = require('fast-glob');

export interface Options {
  allowIgnores: boolean;
  includeRequires: boolean;
  includeExports: boolean;
}

async function expandGlobs(globs: string[]) {
  const inputPaths: string[] = await fg(globs);
  return inputPaths.map((input) => path.resolve(input)).sort();
}

/** @return true if it printed anything */
export async function printCyclesInGlobs(
  inputGlobs: string[],
  options: Options,
): Promise<boolean> {
  const inputPaths = await expandGlobs(inputGlobs);
  const root = longestCommonPrefix(inputPaths);
  const dependencies = dependenciesForPaths(
    inputPaths,
    (ref) =>
      ref.source.startsWith('.') &&
      (options.includeExports || ref.kind !== 'export') &&
      (options.includeRequires || ref.kind !== 'require') &&
      (options.allowIgnores ? !ref.ignored : true),
  );

  const problems = circularDependencies(dependencies);
  if (!problems.length) return false;

  cleanupCircularDependencies(problems);
  printCircularDependencies(root, problems);

  return true;
}

function printCircularDependencies(root: string, problems: string[][]) {
  console.log(`Found cycles in ${root}:`);

  for (const problem of problems) {
    console.log(' * ' + problem.map((p) => stripPrefix(root, p)).join(' -> '));
  }
}
