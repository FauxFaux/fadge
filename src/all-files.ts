import * as path from 'path';
import { circularDependencies, cleanupCircularDependencies } from './cycles';
import { longestCommonPrefix, stripPrefix } from './dosh';
import { dependenciesForPaths } from './dependencies';
import fg = require('fast-glob');
import yargs = require('yargs');

async function expandGlobs(globs: string[]) {
  const inputPaths: string[] = await fg(globs);
  return inputPaths.map((input) => path.resolve(input)).sort();
}

export async function allFiles() {
  const inputGlobs = yargs(process.argv.slice(2)).argv._ as string[];
  const inputPaths = await expandGlobs(inputGlobs);
  const root = longestCommonPrefix(inputPaths);
  const dependencies = dependenciesForPaths(
    inputPaths,
    (ref) => ref.kind !== 'export' && ref.source.startsWith('.'),
  );

  const problems = circularDependencies(dependencies);
  if (!problems.length) return;

  cleanupCircularDependencies(problems);
  printCircularDependencies(root, problems);

  process.exitCode = 1;
}

function printCircularDependencies(root: string, problems: string[][]) {
  console.log(`Found cycles in ${root}:`);

  for (const problem of problems) {
    console.log(' * ' + problem.map((p) => stripPrefix(root, p)).join(' -> '));
  }
}

allFiles().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
