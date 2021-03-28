#!/usr/bin/env node

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

interface Options {
  allowIgnores: boolean;
  includeRequires: boolean;
  includeExports: boolean;
}

export async function cli() {
  await yargs(process.argv.slice(2))
    .demandCommand()
    .command(
      'detect-cycles [options] <globs...>',
      'find circular dependencies between files',
      (yargs) => {
        return yargs
          .option('allowIgnores', {
            type: 'boolean',
            describe: 'honour `// fadge-ignore reason` comments',
            default: false,
          })
          .option('includeRequires', {
            type: 'boolean',
            describe: 'follow legacy `require()` where possible',
            default: true,
          })
          .option('includeExports', {
            type: 'boolean',
            describe: 'follow `export {..} from..`',
            default: false,
          });
      },
      async (args) => {
        const inputGlobs = args.globs as string[];

        if (await printCyclesInGlobs(inputGlobs, args)) {
          process.exitCode = 1;
        }
      },
    )
    .wrap(Math.min(100, yargs.terminalWidth())).argv;
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

cli().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
