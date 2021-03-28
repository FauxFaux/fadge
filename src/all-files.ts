import { readFileSync } from 'fs';
import * as path from 'path';

import fg = require('fast-glob');
import yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

import { findImports, Reference } from './extract';
import { circularDependencies, Dependencies } from './cycles';
import { expand } from './wip';
import { includesSubsequence, sortBy } from './dosh';

export async function allFiles() {
  const paths = yargs(hideBin(process.argv)).argv._ as string[];
  const inputPaths = await fg(paths);
  const modules: Dependencies = {};
  for (const inputPath of inputPaths.map((input) => path.resolve(input)).sort()) {
    const sourceText = readFileSync(inputPath, { encoding: 'utf-8' });
    const inputDirName = path.dirname(inputPath);

    let references: Reference[];
    try {
      references = findImports(sourceText);
    } catch (e) {
      e.message += ` while parsing ${inputPath}`;
      throw e;
    }

    const referencedPaths = new Set<string>();
    for (const ref of references) {
      if (ref.kind === 'export' || ref.typeOnly) {
        continue;
      }

      if (!ref.source.startsWith('.')) {
        continue;
      }

      referencedPaths.add(expand(inputDirName, ref.source));
    }

    modules[inputPath] = [...referencedPaths].sort();
  }

  const problems = circularDependencies(modules);
  sortBy(
    problems,
    ({ length }) => length,
    ([item]) => item,
  );
  removeDuplicateCycles(problems);
  console.log(problems);
}

function removeDuplicateCycles(problems: string[][]) {
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

allFiles().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
