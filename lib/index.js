#!/usr/bin/env node

/* Dependencies */
const fs = require('fs'), path = require('path');

/* Exports */
module.exports = mdon;

/* Settings */
const debugging = false; // { parse: true, fragments: false, print: true, output: '.out', rounttrips: 5 };
const defaults = { output: true, backup: false }; // '.out'

/* Imports */
const
    { readFileSync, existsSync, writeFileSync, renameSync } = fs,
    { resolve, dirname, basename, relative } = path,
    { assign: define } = Object;

/* Definitions */
const
    LINKS = Symbol('MDon::Links'),
    matchers = {
        alias: /^[a-z0-9]+(\-[a-z0-9]+)*$/,
        interpolations: /\$\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}/g,
        operations: /\@(\w+)/g,
        properties: /\{\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}\}/g,
        fragments: /^(<\?[ \t]*.*?\?\>[ \t]*\n(?:(?:.*?\n)*?|)(?:<\?\!)>[ \t]*|.*?)$/m,
        parts: /^(?:<\?[ \t]*(.*?)[ \t]*\?\>([ \t]*\n(?:.*?\n)*?)(?:<\?\!)>[ \t]*|.*?)$/m,
        linebreaks: define(/\n(?!<\?[^\!])/g, {
            text: '\n',
            any: /(\r\n|\n|\r)/mg,
            extranous: /(\n)(\s*\n)+/gm,
        }),
    };

/* Helpers */
const
    resolveModule =
        (typeof require === 'function' && typeof require.resolve === 'function' && require.resolve) ||
        (typeof module !== 'undefined' && module.Module && module.Module._resolveFilename) ||
        (() => ''),
    readJSON = typeof require === 'function' && require || ((path) => JSON.parse(readFileSync(path).toString())),
    [stdout, cwd, argv] = typeof process !== 'undefined' && [
        process.stdout && process.stdout.columns > 0 && process.stdout,
        typeof process.cwd === 'function' && process.cwd() || './',
        process.argv || []
    ],
    columns = stdout && Math.min(stdout.columns, 120) || 8,
    pagebreak = stdout ? [`\n\n${'-'.repeat(columns)}\n\n`] : [],
    now =
        /** Isomorphic high-resolution timestamp in milliseconds */
        typeof performance !== 'undefined' && performance.now
            || typeof process !== 'undefined' && process.hrtime
            ? (hrTime = process.hrtime()) => hrTime[0] * 1000 + hrTime[1] / 1000000
            : Date.now,
    datestamp = (
        date = new Date(),
        { locale = 'en-US', timeZone = 'GMT', timeZoneName = 'short',
            weekday = 'long', day = 'numeric', month = 'long', year = 'numeric',
            hour = 'numeric', minute = '2-digit', second = '2-digit', ...options } = {}
    ) => date.toLocaleDateString(locale, {
        timeZone, timeZoneName, weekday, day, month, year, hour, minute, second, ...options
    }),
    normalizeLineBreaks = string => string
        .replace(matchers.linebreaks.any, '\n')
        .replace(matchers.linebreaks.extranous, '$1$1'),
    formatException = exception =>
        `\n<!-- \`${(
            typeof exception === 'string' ? exception
                : exception && typeof exception.message === 'string' && exception.message || 'FAILED!'
        ).replace('`', '\`')}\` -->\n`,
    formatBody = ({ macro, body }) =>
        macro ? `<? ${macro} ?>${body}<?!>` : body,
    toString = string => typeof string === 'string' && string || '',
    toAlias = string =>
        matchers.alias.test((string = toString(string).trim().toLowerCase())) && string || '',
    tryMacro = (macro, context) => {
        try { return macro.call(context) } catch (exception) { return exception }
    };

/* Classes */

function Macro(macro) {
    return new Function('global', 'require', 'process', 'module', 'exports', `return ${macro};`);
}

class Context {
    constructor(properties, path = cwd) {
        Object.assign(this, properties, { path });
        this[LINKS] = { refs: {}, aliases: {}, length: 0 };
    }

    $exception(exception) {
        return formatException(exception);
    }

    $format(string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`
    }

    $resolve(ref) {
        return resolveModule(resolve(this.path, `./${ref}`));
    }

    $alias(ref, prefix = 'link') {
        if (!(ref = toString(ref).trim()))
            throw `Cannot create alias from reference: ${arguments[0]}`;
        else if (!(prefix = toAlias(prefix))) // typeof prefix !== 'string' || !(prefix = prefix.trim()) || /[a-z]+(\-[a-z]+)+/.test(prefix = prefix.toLowerCase()))
            throw `Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`;

        let alias = this[LINKS].aliases[ref];

        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = toAlias(`${prefix}-${++links.length}`)] = ref;
        }

        return alias;
    }

    $ref(alias) {
        if (!(alias = toAlias(alias)))
            throw `Cannot create reference from alias: ${arguments[0]}`;

        const { [LINKS]: { refs: { [alias]: ref } } } = this;

        if (!ref)
            throw `Cannot find reference from alias ${arguments[0]}.`

        return ref;
    }

    $exists(ref) {
        return this.$format(relative(this.path, this.$resolve(ref)));
    }

    $include(ref) {
        const content = read(this.$resolve(ref));
        return matchers.fragments.test(content)
            ? this.$parse(content)
            : this.$format(content)
    }

    $parse(md) {
        return this.$format(parse(md, this, false));
    }

}

/* Methods */

function read(filename) {
    return readFileSync(filename).toString();
}

function write(filename, contents, { flag = 'w', backup = defaults.backup, ...options } = {}) {
    backup && autobackup(filename);
    return writeFileSync(filename, contents, { flag, ...options });
}

function autobackup(filename, i = 0) {
    while (existsSync(filename))
        filename = `${arguments[0]}.${i++}`;
    return i > 0 ? (fs.renameSync(arguments[0], filename)) : null;
}

function parse(source, context, root = true) {
    const raw = normalizeLineBreaks(source);
    const fragments = raw.split(matchers.fragments);
    const output = [];

    const log = debugging.parse && console.log || (() => { });

    debugging.aliasing && log('raw:\n', raw, ...pagebreak);
    debugging.fragments && log(['fragments:', ...fragments].join(`\n${'-'.repeat(columns)}\n`), ...pagebreak);

    for (const fragment of fragments) {
        let [, macro, body, ...rest] = matchers.parts.exec(fragment) || '';
        let parts = { fragment, macro, body, rest };
        if (macro === '!') {
            output.push('\n');
        } else if (macro) {
            const ƒ = new Macro(
                macro
                    .replace(matchers.operations, 'this.$$$1')
                    .replace(matchers.interpolations, '${this.$format(this.$1)}')
                    .replace(matchers.properties, 'this.$1')
            );
            const result = tryMacro(ƒ, context);
            const newBody = formatBody({ macro, body: result.message ? formatException(result) : result });
            parts.substitute = newBody;
            output.push(newBody);
        } else {
            output.push(fragment);
        }

        log(parts);
    }

    const { [LINKS]: { length: links, aliases, refs } } = context;

    if (root) {
        output.push('\n\n<?!?>')

        if (links) for (const [alias, ref] of Object.entries(refs))
            output.push(`\n[${alias}]: ${ref}`);

        output.push(`\n---\nLast Updated: ${datestamp()}`);
        output.push('\n<?!>\n')
    }

    const result = normalizeLineBreaks(output.join(''));

    return result;
}

/* API */

function mdon(pkgpath = './package.json', mdpath = './README.md', outpath = defaults.output) {
    pkgpath = resolveModule(resolve(cwd, pkgpath || './package.json'));
    const pkgdir = dirname(pkgpath);
    const pkginfo = readJSON(pkgpath);

    mdpath = resolve(cwd, pkgdir, mdpath || './README.md');
    let rawpath = resolve(cwd, pkgdir, 'docs', mdpath || './README.md');

    if (!existsSync(rawpath)) rawpath = mdpath;

    const mdin = read(rawpath);

    const started = now();
    const context = new Context(pkginfo, pkgdir);
    let mdout = parse(mdin, context);
    const elapsed = now() - started;

    if (debugging.rounttrips > 0)
        for (let i = 0, { rounttrips: n } = debugging; i < n; i++)
            mdout = parse(mdout, context);

    outpath = outpath && (
        outpath === true
            ? mdpath
            : /^\.\w+$/.test(outpath) && mdpath.replace(/(\..*?$)/, `${outpath}$1`)
    ) || false;

    if (outpath && (!debugging || debugging.output))
        write(outpath, mdout);

    if (debugging.print) console.log(`
${'-'.repeat(columns)}
FILE  | ${outpath}
------|${'-'.repeat(columns - 7)}
${mdout.split('\n').map((l, i) => `${`${i + 1}`.padStart(5, '     ')} | ${l}`).join('\n')}
${'-'.repeat(columns)}`
    );

    console.log(`MDon: ${mdpath} done in ${elapsed.toFixed(1)} ms`);

    return mdout;
}

Object.assign(mdon, { mdon, read, write, parse, Context });

/* CLI */
const
    // mainmodule = typeof require === 'function' && require.main && typeof module !== 'undefined' ? require.main === module,
    argi = argv.findIndex(
        arg => /[\/\\](mdon[\/\\]lib[\/\\]index\.m?js|\.bin[\/\\]mdon\~?)$/.test(arg)
    ) || -1,
    args = argi > -1 && argv.slice(argi + 1) || [];

if (argi > -1) {
    let pkgpath;
    if (args.length === 1) {
        pkgpath = resolve(cwd, args[0], 'package.json');

        if (!existsSync(pkgpath))
            throw `The specified path does not resolve to a valid package.json: ${pkgpath}`;
    }
    mdon(pkgpath);
}
