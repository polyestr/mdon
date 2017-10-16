<? `![${displayName} logo][${@alias('https://cdn.rawgit.com/polyestr/mdon/master/assets/logo.svg', 'asset')}]` ?>
<?!>

<? `# ${displayName}` ?>
<?!>

<? `${description}` ?>
<?!>

<? ?>
**Note:** MDon is still highly experimental and is not yet cross-platform
enabled, so if you managed to use it on Windows or Linux or worked-out quirks,
please submit an issue, not a PR at this point, but feel free to gist.
<?!>

<? `## Installation\n\n    » yarn add ${name}` ?>
<?!>

<? `${@include('docs/USAGE.md')}` ?>
<?!>

<? `\n\n---\n\n${@include('docs/CONCEPTS.md')}` ?>
<?!>

<? `\n\n---\n${@include('docs/FAQ.md')}` ?>
<?!>
