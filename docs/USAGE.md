## CLI

MDon provides a CLI which is intended for use with scripts defined in your local
package.json (assuming you follow the recommended practice of installing tools
like MDon locally inside your projects). When MDon is installed locally, you
can call the CLI by prefixing it with `./node_modules/.bin/` (or the equivalent
relative to your local `node_modules` folder path).

To process `README.md` in the current directory simply execute:

    » mdon

To process another markdown file simply add it's relative path as an argument:

    » mdon relative/path/to/FILE.md
    » mdon ./relative/path/to/FILE.md
    » mdon /absolute/path/to/FILE.md

If you get errors related to import/export then you might be running a NodeJS
version that does not support ES modules. If that is the case consider using
the CommonJS flavour of MDon:

    » mdon~ …

This will execute and identical implementation which uses CJS-style require
instead of ES module import/export.

**Note:** *Always call MDon from the root of your local package.*

If you need to call it from a different root follow this pattern:

    » pushd path/to/package/root; mdon; popd;

Read more on [`pushd` and `popd` on Wikipedia](https://en.wikipedia.org/wiki/Pushd_and_popd).

## API

MDon is meant to be used from the command-line, however, you can still use it
in your code through it's single-function simple interface.

```js
  import mdon from 'mdon';
```

Or for legacy common-js:

```js
  const mdon = require('mdon');
```

This function will process a single markdown file:

```js
  import mdon from 'mdon';

  /* To process and write the file, mimicing the CLI's behavior */
  mdon('path-to-package.json', 'path-to-DOCUMENT.md');

  /* To capture the processed output without writing to the original file */
  const processedMarkdown = mdon('path-to-package.json', 'path-to-DOCUMENT.md', false);

  /* To process the file and write the output to a different path */
  mdon('path-to-package.json', 'path-to-DOCUMENT.md', 'path-to-OUTPUT.md');

  /* Alternativly, can also prepend and the output filename's extension */
  mdon('path-to-package.json', 'path-to-DOCUMENT.md', '.out');

```
