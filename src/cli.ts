#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-require-imports
import yargs = require('yargs');
import { printCyclesInGlobs } from './detect-cycles.js';

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
          .option('includeTypes', {
            type: 'boolean',
            describe: 'follow `import { type ..} from..`',
            default: false,
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

cli().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
