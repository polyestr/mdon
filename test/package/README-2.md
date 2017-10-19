<!--? `\n![${displayName} logo][${@alias(@exists('../../assets/logo.svg'), 'asset')}]\n` ?-->

![Polyestr MDon Test logo][asset-1]

<!--?!-->

<!--? `\n# ${displayName}\n` ?-->

# Polyestr MDon Test

<!--?!-->

<!--? `\n${description}\n` ?-->

Test package for the stupid simple inline markdown fields used by the Polyestr application framework.

<!--?!-->

<!--? ?-->
<!--?!-->

<!--? `\n### Concepts\n\n${@include('docs/MDON_CONCEPTS.md')}` ?-->

### Concepts

> *Fragments*

Fragments are sections or regions that will be processed in the order by which
they appear in markdown.

  1. Fragments begin with a variant of an opening `<?[ directive ]?>` tag
  immediately at the start of a new line (no spaces).

  2. This is followed by an optional body which ends with the closing `<?!>`
  tag also on a new line without spaces.

  3. If it is not in a well-formed fragment it will come back to haunt you.

> *Directives*

Directives are either a marker or a template literal expression enclosed between
the `<?` and `?>` of an opening tag.

1. Static tags starting with `<? ?>` make MDon hands-off till `<?!>`.

2. Generated tags starting with `<?!?>` make everything till `<?!>` sleep
with the fishes (those are MDons business not yours).

3. Template tags starting with ``<? `MDon will obey your ${[interpolations]}` ?>``
make up everything that will take over till `<?!>`.

> *Interpolations*

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

> *Gotchas*

  1. If you don't match your `<?…?>` with a `<?!>` you'll be sorry, things tend
  to go missing so if you want static content that does not go swimming wrap
  those lines with the `<? ?>` on the line before and `<?!>` on the line after.

  2. No plugins, so hack all you want, it's one file, copy it into your project
  and hack away, that's better than flooding your code with plugins.

  3. MDon likes to put things in multiples of 3, you know, a-b-c, 1-2-3.

<!--?!-->

<!--? ?-->
[mdon-gist]: https://gist.github.com/daflair/d92ae1d4f54d7cb43a434388c6adabaf
<!--?!-->

<!--?!?-->
[asset-1]: ../../assets/logo.svg

---
Last Updated: Thursday, October 19, 2017, 7:55:04 PM UTC
<!--?!-->
