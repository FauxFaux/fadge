import { extraction } from '../src/extract-deep';

test('resolving', () => {
  // language=JavaScript
  extraction(`
      import { a } from './a';
      import * as c from './c';
      export function b() {
        a();
        if (true) {
          c.wonky();
        }
      }
    `
  );
});
