import * as path from 'path';
import { findReferencesForSourceFile } from './find-references';
import {
  circularDependencies,
  Dependencies,
  removeDuplicateCycles,
} from './cycles';
import { resolveRelativeImportToPath } from './resolve-import';
import { longestCommonPrefix, sortBy, stripPrefix } from './dosh';
import fg = require('fast-glob');
import yargs = require('yargs');

async function expandGlobs(globs: string[]) {
  const inputPaths: string[] = await fg(globs);
  return inputPaths.map((input) => path.resolve(input)).sort();
}

function modulesForPaths(inputPaths: string[]) {
  const modules: Dependencies = {};

  for (const inputPath of inputPaths) {
    const references = findReferencesForSourceFile(inputPath);

    const inputDirName = path.dirname(inputPath);
    const referencedPaths = references
      .filter((ref) => ref.kind !== 'export' && ref.source.startsWith('.'))
      .map((ref) => resolveRelativeImportToPath(inputDirName, ref.source));

    modules[inputPath] = [...new Set(referencedPaths)].sort();
  }

  return modules;
}

export async function allFiles() {
  const inputGlobs = yargs(process.argv.slice(2)).argv._ as string[];
  const inputPaths = await expandGlobs(inputGlobs);
  const root = longestCommonPrefix(inputPaths);
  const modules = modulesForPaths(inputPaths);

  const problems = circularDependencies(modules);
  if (!problems.length) return;

  sortBy(
    problems,
    ({ length }) => length,
    ([item]) => item,
  );
  removeDuplicateCycles(problems);

  console.log(`Found cycles in ${root}:`);

  for (const problem of problems) {
    console.log(' * ' + problem.map((p) => stripPrefix(root, p)).join(' -> '));
  }

  process.exitCode = 1;
}

allFiles().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
