<!--@docs/README.md@-->
<!--? `![${displayName} logo][${@alias('https://cdn.rawgit.com/polyestr/mdon/master/assets/logo.svg', 'asset')}]` ?-->
![Polyestr MDon logo][asset-1]
<!--?!-->

<!--? `# ${displayName}` ?-->
# Polyestr MDon
<!--?!-->

<!--? `${description}` ?-->
Stupid simple inline markdown fields used by the Polyestr application framework.
<!--?!-->

<!--? `${@include('docs/FEATURES.md')}` ?-->
## Features

* Hackable, zero-dependency, fast, lightweight (so nothing new).
* Auto-inject content from package.json.
* Include content from other files.
* Familiar syntax that is mostly template literal like.
* Embedded annotations without the need for source files.
* First-class opt-in support for using raw "source" files.
* Simple but elegant fault-tolerance to prevent malformed output.
* Doesn't mess with your YAML frontmatter!
* Works like a swiss-army knife instead of a shop - 3 concepts to get started.

<!--?!-->

<!--? ?-->
**Note:** MDon is still highly experimental and is not yet cross-platform
enabled, so if you managed to use it on Windows or Linux or worked-out quirks,
please submit an issue, not a PR at this point, but feel free to gist.
<!--?!-->

<!--? `## Installation\n\n    » yarn add ${name}` ?-->
## Installation

    » yarn add mdon
<!--?!-->

<!--? `${@include('docs/USAGE.md')}` ?-->
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

<!--?!-->

<!--? `\n\n---\n\n${@include('docs/CONCEPTS.md')}` ?-->

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

      a. Either `${@exists(path/to/file)}` finds the file relative to the root
      of the package or it throws and you get nothing out.

      b. You can borrow `${@include(…/file)}` from other files in your package.

      c. With `${@alias(<relative-or-absolute-url>)}` you get `[title][alias]`
      instead of `[title](<relative-or-absolute-url>)`, this means that you also
      will get see a line that looks like `[alias]: <relative-or-absolute-url>`
      at the end of the file, it's just how aliases work in markdown.

  3. `` `${ {{displayName}} + ' ' + {{version}} }` `` is MDon's way of taking
  care of business if you decide that programming should be be something the
  MDon takes care of anyway, but honestly is `` `${displayName} ${version}` ``
  not good enought already… MDon always asks himself that question.

## Perks

> **Using Raw "Source" Paths:**
>
> A common and highly recommended structure when working with compiled files is
to separate source files from compiled files, which is not a requirement for
MDon since it can recompile from compiled files but may still be a more robust
setup in case something goes wrong. To opt in to this behaviour the first line
of the target file needs to be begin with `<!--@path/to/source.md@-->`.
>
> So if you want your `./README.md` to compile from `./docs/README.md` then you
can simply create a blank `./README.md` and set the first line to `<!--@docs/README.md-->`.

## Gotchas

  1. If you don't match your `<?…?>` with a `<?!>` you'll be sorry, things tend
  to go missing so if you want static content that does not go swimming wrap
  those lines with the `<? ?>` on the line before and `<?!>` on the line after.

  2. No plugins, so hack all you want, it's one file, copy it into your project
  and hack away, that's better than flooding your code with plugins.

  3. MDon likes to put things in multiples of 3, you know, a-b-c, 1-2-3.

<!--?!-->

<!--? `\n\n---\n${@include('docs/FAQ.md')}` ?-->

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

<!--?!-->

<!--?!?-->
[asset-1]: https://cdn.rawgit.com/polyestr/mdon/master/assets/logo.svg

---
Last Updated: Thursday, October 19, 2017, 7:55:05 PM UTC
<!--?!-->
