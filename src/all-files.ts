import { readFileSync } from 'fs';
import * as path from 'path';

import fg = require('fast-glob');
import yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

import { findImports } from './extract';
import { circularDependencies, Dependencies } from './cycles';
import { expand } from './wip';
import { includesSubsequence, sortBy } from './dosh';

export async function allFiles() {
  const paths = yargs(hideBin(process.argv)).argv._ as string[];
  const inputs = await fg(paths);
  sortBy(
    inputs,
    (input) => directoryDepth(input),
    (input) => input,
  );
  const modules: Dependencies = {};
  for (const input of inputs) {
    modules[input] = [];
    for (const ref of findImports(readFileSync(input).toString('utf-8'))) {
      if (ref.kind === 'export' || ref.typeOnly) {
        continue;
      }

      if (!ref.source.startsWith('.')) {
        continue;
      }

      modules[input].push(expand(path.dirname(input), ref.source));
    }
  }
  console.log(inputs);
  const problems = circularDependencies(modules);
  sortBy(
    problems,
    ({ length }) => length,
    ([item]) => item,
  );
  for (let i = problems.length - 1; i > 0; --i) {
    const us = problems[i];
    if (alreadyCovered(us, problems.slice(0, i - 1))) {
      problems.splice(i, 1);
    }
  }
  console.log(problems);
}

function alreadyCovered(problem: string[], others: string[][]): boolean {
  for (const other of others) {
    if (includesSubsequence(problem, other)) {
      return true;
    }
  }

  return false;
}

function directoryDepth(filename: string): number {
  // count of '/' characters
  return filename.replace(/[^/]/g, '').length;
}

allFiles();
