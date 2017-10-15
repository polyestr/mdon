<? `\n![${displayName} logo][${@alias(@exists('assets/logo.svg'), 'asset')}]\n` ?>
<?!>

<? `\n# ${displayName}\n` ?>
<?!>

<? `\n${description}\n` ?>
<?!>

<? ?>

## Getting Started

### It looks like this

```
<? start ?>
```

### Installing

MDon is still in it's infancy so you will have to install it from [gist][mdon-gist] for now.

<?!>

<? `\n### Concepts\n\n${@include('docs/CONCEPTS.md')}` ?>
<?!>

<? ?>
[mdon-gist]: https://gist.github.com/daflair/d92ae1d4f54d7cb43a434388c6adabaf
<?!>

<?!?>
[asset-1]: assets/logo.svg
---
Last Updated: Saturday, October 14, 2017, 10:57:54 PM UTC
<?!>
