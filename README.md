<? `![${displayName} logo][${@alias(@exists('assets/logo.svg'), 'asset')}]` ?>
![Polyestr MDon logo][asset-1]
<?!>

<? `# ${displayName}` ?>
# Polyestr MDon
<?!>

<? `${description}` ?>
Stupid simple inline markdown fields used by the Polyestr application framework.
<?!>

<? ?>
**Note:** MDon is still highly experimental and is not yet cross-platform
enabled, so if you managed to use it on Windows or Linux or worked-out quirks,
please submit an issue, not a PR at this point, but feel free to gist.
<?!>

<? `## Installation\n\n    » yarn add ${name}` ?>
## Installation

    » yarn add mdon
<?!>

<? `${@include('docs/USAGE.md')}` ?>
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

<?!>

<? `\n\n---\n## Concepts\n\n${@include('docs/CONCEPTS.md')}` ?>

---
## Concepts

### Fragments

Fragments are sections or regions that will be processed in the order by which
they appear in markdown.

  1. Fragments begin with a variant of an opening `<?[ directive ]?>` tag
  immediately at the start of a new line (no spaces).

  2. This is followed by an optional body which ends with the closing `<?!>`
  tag also on a new line without spaces.

  3. If it is not in a well-formed fragment it will come back to haunt you.

### Directives

Directives are either a marker or a template literal expression enclosed between
the `<?` and `?>` of an opening tag.

1. Static tags starting with `<? ?>` make MDon hands-off till `<?!>`.

2. Generated tags starting with `<?!?>` make everything till `<?!>` sleep
with the fishes (those are MDons business not yours).

3. Template tags starting with ``<? `MDon will obey your ${[interpolations]}` ?>``
make up everything that will take over till `<?!>`.

### Interpolations

Template expressions follow standard javascript interpolations for the most part
but they are evaluated in a sandboxed environment to prevent malicious or
unintended mishaps.

  1. `${displayName}`: Any field in your package.json (only single property
  names or property paths are supported, not statements).

  2. `${@<operation>( … args )}`: MDon will, at least:

      a. Either `${@exists(relative/path/to/file)}` finds the file or it throws
      and you get nothing out.

      b. You can borrow `${@include(relative/path/to/file)}` from others.

      c. With `${@alias(<relative-or-absolute-url>)}` you get `[title][alias]`
      instead of `[title](<relative-or-absolute-url>)`, this means that you also
      will get see a line that looks like `[alias]: <relative-or-absolute-url>`
      at the end of the file, it's just how aliases work in markdown.

  3. `` `${ {{displayName}} + ' ' + {{version}} }` `` is MDon's way of taking
  care of business if you decide that programming should be be something the
  MDon takes care of anyway, but honestly is `` `${displayName} ${version}` ``
  not good enought already… MDon always asks himself that question.

### Gotchas

  1. If you don't match your `<?…?>` with a `<?!>` you'll be sorry, things tend
  to go missing so if you want static content that does not go swimming wrap
  those lines with the `<? ?>` on the line before and `<?!>` on the line after.

  2. No plugins, so hack all you want, it's one file, copy it into your project
  and hack away, that's better than flooding your code with plugins.

  3. MDon likes to put things in multiples of 3, you know, a-b-c, 1-2-3.

<?!>

<? `\n\n---\n${@include('docs/FAQ.md')}` ?>

---
## FAQ

> **Q:** What could cause some markdown to show up as raw text or simply vanish
instead of rendered HTML, when all fragments seem to be properly terminated?
>
> > **A:** If all your fragments are terminated correctly, then the likely cause
of this behavior is that you did not wrap this section in a static fragment.
<br/> <br/> It was a design choice to use `<?!>` as the terminator, knowing that for
major markdown breaks as they expect such tags to look more like `<?…?>`. This
meant that any thing that followed this closing tag can and will likely break
when parsed. That's why static fragment wrapper is highly encouraged, as most
parsers will overcome the side-effects of malformed `<?!>` once they hit a
properly formed one.

> **Q:** What can cause the body of a fragment that used to be processed correctly
to suddenly disappear if the same directive used to work fine previously.
>
> > **A:** If any errors occur while parsing a directive, the entire fragment will
be replaced by an HTML comment containing the message from the exception. This
should provide some hint on what would have cause the directive to fail without
bloating MDon's code with more complex debugging mechanism. If you can't figure
out the reason from this message, you can try using your prefered node debugger.

> **Q:** What could cause an entire fragment (directive and body) to always get
dropped even after manually putting it back?
>
> > **A:** This is a good time to file an issue so we can figure out where MDon can
evolve to meet your practical needs.

<?!>

<?!?>
[asset-1]: assets/logo.svg

---
Last Updated: Monday, October 16, 2017, 11:48:06 AM UTC
<?!>
