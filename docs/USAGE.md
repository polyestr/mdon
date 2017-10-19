## CLI

MDon provides a CLI which is intended for use with scripts defined in your local
package.json (assuming you follow the recommended practice of installing tools
like MDon locally inside your projects). When MDon is installed locally, you
can call the CLI by prefixing it with `./node_modules/.bin/` (or the equivalent
relative to your local `node_modules` folder path).

To process `README.md` in the current directory simply execute:

    » mdon

You can also list one or more markdown files to process them:

    » mdon README.md OTHER.md

### Additional (less-safe) Arguments

There are some other CLI features which are not fully tested so please use with
care.

Your system might support using globs instead of listing each file:

    » mdon *.md

You can specify a different package root as the first argument as long as the
name of that folder doesn't look like a filename (aka no extension) but then
you will have to prefix your markdown files (if any are supplied) with the same
path prefix:

    » mdon path/to/package path/to/package/*.md

The `./` in relative paths are optional:

    » mdon relative/path/to/FILE.md
    » mdon ./relative/path/to/FILE.md
    » mdon /absolute/path/to/FILE.md

If you want to output to a different file you can only do so by appending a
suffix to the name (before the extension) which must begin with a dot and
include no spaces. So if you want `README.md` to be compiled to `README.out.md`
you can do this:

    » mdon .out

> **Important:**
>
> If any argument looks like a file extension MDon might treat it as a suffix
argument so if your markdown files or package path "awkwardly" look like an
extension, either rename them (pretty-please) or try preceeding such arguments
with either `-p` or `-m` which is explained below.

### Explicit Arguments

If you prefer to be more explicit about your arguments and marshal over some of
the syntatic restrictions you can always use dash-styled markers:

    » mdon -p path/to/package -m README.md OTHER.md -o .out
    » mdon -p path/to/package -m README.md -o .out -m OTHER.md

But keep in mind that globs must always be relative to the current path. Also,
you cannot specify a different projects or different suffixes so multiple `-p`
or `-o` simply mean that the last one is used for all the markdown files.

### Legacy Systems

If you get errors related to import/export then you might be running a NodeJS
version that does not support ES modules. If that is the case consider using
the CommonJS flavour of MDon:

    » mdon~ …

This will execute and identical implementation which uses CJS-style require
instead of ES module import/export.

### Package Scripts

It is recommended when dealing with nested packages to always call MDon from the
root of each package to prevent unintended outcomes.

If you need to call it from a different root follow this universal pattern:

    » pushd path/to/package/root; mdon; popd;

Read more on [`pushd` and `popd` on Wikipedia](https://en.wikipedia.org/wiki/Pushd_and_popd).

Also, avoid using globbs with `**` which could match a markdown file in a nested
package assuming it belongs to the top package, at which point it will simply
use the top package's JSON fields in place of the nest one.

## API

MDon is meant to be used from the command-line, however, you can still use it
in your code through it's simple single-function interface which will process
a single markdown file at a time (does not glob).

```js
  import mdon from 'mdon';
```

Or for legacy common-js:

```js
  const mdon = require('mdon');
```

To process and write the file, mimicing the CLI's behavior:

```js
  mdon('<path/to/package>', '<path/to/DOCUMENT.md>');
```

To capture the processed output after MDon writes the output:

```js
  const processedMarkdown = mdon('<path/to/package>', '<path/to/DOCUMENT.md>');
```

To simply capture the processed output without writing the output:

```js
  const processedMarkdown = mdon('<path/to/package>', '<path/to/DOCUMENT.md>', false);
```

To append a suffix to the name of the output file:

```js
  mdon('<path/to/package>', '<path/to/DOCUMENT.md>', '.out');
```

To process the file and write the output to a different file (work in progress, use cautiously):

```js
  mdon('<path/to/package>', '<path/to/DOCUMENT.md>', '<path/to/OUTPUT.md>');
```

