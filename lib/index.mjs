#!/usr/bin/env node --experimental-modules --no-warnings --

/* Dependencies */
import fs from 'fs';
import path from 'path';
import module from 'module';

/* Exports */
export { mdon, read, write, parse, Context }; export default mdon;

/* Settings */
const debugging = false; // { parse: true, fragments: false, print: true, output: true };
const defaults = { output: true, backup: false }; // '.out'

/* Imports */
const
    { readFileSync, existsSync, writeFileSync, renameSync } = fs,
    { resolve, dirname, basename, relative } = path,
    { assign: define } = Object;

/* Definitions */
const
    LINKS = Symbol('MDon::Links'),
    /**
     * RegExp based matchers for markdown splitting & replacing operations.
     */
    matchers = {
        alias: /^[a-z0-9]+(\-[a-z0-9]+)*$/,
        interpolations: /\$\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}/g,
        operations: /\@(\w+)/g,
        properties: /\{\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}\}/g,
        // fragments: /^(<\?[ \t]*.*?\?>[ \t]*\n(?:(?:.*?\n)*?|)(?:<\?\!)>[ \t]*|.*?)$/m,
        fragments: /^(<\?[ \t]*.*?\?>[ \t]*\n(?:(?:.*?\n)*?|)(?:<\?\!)>[ \t]*|<\!--\?[ \t]*.*?\?-->[ \t]*\n(?:(?:.*?\n)*?|)(?:<\!--\?\!)-->[ \t]*)$/m,
        // parts: /^(?:<\?[ \t]*(.*?)[ \t]*\?>([ \t]*\n(?:.*?\n)*?)(?:<\?\!)>[ \t]*|.*?)$/m,
        // parts: /^(?:<(?:\!--|)\?[ \t]*)(.*?)(?:[ \t]*(?:--|)\?>)([ \t]*\n(?:.*?\n)*?)(?:<\?\!>|<\!--\?\!-->)(?:[ \t]*|.*?)$/m,
        parts: /^(?:(?:<\!--|<)\?[ \t]*(.*?)[ \t]*\?(?:-->|>)|)([ \t]*\n(?:.*?\n)*?)(?:<\?\!>|<\!--\?\!-->|)$/m,
        linebreaks: define(/\n(?!<\?[^\!])/g, {
            text: '\n',
            any: /(\r\n|\n|\r)/mg,
            extranous: /(\n)(\s*\n)+/gm,
        }),
    };


/* Helpers */
const {
    callable, object, string, VOID, NOOP,
    resolveModule, readJSON, cwd, argv,
    columns, pagebreak, now, datestamp,
} = (
        /**
         * Runtime-dependent helpers define in one function for portablity
         */
        ({
        VOID = Object.create(null), NOOP = (() => VOID),
            typeguard = (type, value, fallback) => typeof value === type ? value : fallback,
            callable = typeguard.bind(null, 'function'),
            object = typeguard.bind(null, 'object'),
            string = typeguard.bind(null, 'string'),
            require = VOID, Module = VOID,
            performance: { now } = VOID,
            process: { stdout, argv = [], hrtime, cwd } = VOID,
            columns = stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80,
            helpers = {
                callable, object, string, VOID, NOOP,
                argv, cwd: typeof cwd === 'function' && cwd() || './',
                columns, pagebreak: stdout ? [`\n\n${'-'.repeat(columns)}\n\n`] : [],
                resolveModule: callable(require.resolve) || callable(Module._resolveFilename) || NOOP,
                readJSON: callable(require) || ((path) => JSON.parse(readFileSync(path).toString())),
                now: callable(now) || (callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)) || Date.now,
                datestamp: define(
                    (date = new Date(), options = helpers.datestamp.defaults) =>
                        date && callable(date.toLocaleDateString) && (
                            options = object(options) || datestampDefaults,
                            date.toLocaleDateString(string(options.locale) || 'en-US', options)
                        ),
                    {
                        defaults: {
                            locale: 'en-US', timeZone: 'GMT', timeZoneName: 'short',
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                            hour: 'numeric', minute: '2-digit', second: '2-digit'
                        }
                    }
                ),
            }
    }) => helpers)({
            process: typeof process !== 'undefined' && process,
            require: typeof require === 'function' && require,
            Module: typeof module !== 'undefined' && module.Module,
            performance: typeof performance !== 'undefined' && performance,
        });

const
    normalizeLineBreaks = string => string
        .replace(matchers.linebreaks.any, '\n')
        .replace(matchers.linebreaks.extranous, '$1$1'),
    normalizeAlias = value =>
        matchers.alias.test((value = string(value, '').trim().toLowerCase())) && value || '',
    formatException = exception =>
        `\n<!-- \`${(
            typeof exception === 'string' ? exception
                : exception && typeof exception.message === 'string' && exception.message || 'FAILED!'
        ).replace('`', '\`')}\` -->\n`,
    formatBody = ({ directive = '!', body }) =>
        string(directive) ? `<? ${directive} ?>${body}<?!>` : body;

/* Prototypes */

/**
 * Low-overhead sandbox suitable for evaluating directives.
 * Users must bbe aware of potential security risks.
 */
function Macro(source) {
    return new Function('global', 'require', 'process', 'module', 'exports', `return ${source};`);
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
        if (!(ref = string(ref, '').trim()))
            throw `Cannot create alias from reference: ${arguments[0]}`;
        else if (!(prefix = normalizeAlias(prefix))) // typeof prefix !== 'string' || !(prefix = prefix.trim()) || /[a-z]+(\-[a-z]+)+/.test(prefix = prefix.toLowerCase()))
            throw `Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`;

        let alias = this[LINKS].aliases[ref];

        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = normalizeAlias(`${prefix}-${++links.length}`)] = ref;
        }

        return alias;
    }

    $ref(alias) {
        if (!(alias = normalizeAlias(alias)))
            throw `Cannot create reference from alias: ${arguments[0]}`;

        const { [LINKS]: { refs: { [alias]: ref } } } = this;

        if (!string(ref))
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

    $links() {
        const { [LINKS]: { length, refs } } = this;
        let entries = length && Object.entries(refs), links = [];
        for (let i = 0; i < entries.length; i++)
            links.push(`[${entries[i][0]}]: ${entries[i][1]}`);
        return links.length ? links.join('\n') + '\n' : '';
    }
}

/* API */

function mdon(pkgpath = './package.json', mdpath = './README.md', outpath = defaults.output) {
    pkgpath = resolveModule(resolve(cwd, pkgpath || './package.json'));
    const pkgdir = dirname(pkgpath);
    const pkginfo = readJSON(pkgpath);

    let rawpath = resolve(cwd, pkgdir, 'docs', mdpath || './README.md');
    mdpath = resolve(cwd, pkgdir, mdpath || './README.md');

    if (!existsSync(rawpath)) rawpath = mdpath;

    const mdin = read(rawpath);

    const started = now();
    const context = new Context(pkginfo, pkgdir);
    let mdout = parse(mdin, context);
    const elapsed = now() - started;

    if (rawpath !== mdpath)
        mdout = mdout.replace(/^<(\?.*?[^-])>$/mg, '<!--$1-->');// normalizeLineBreaks(mdout.replace(/^<\?.*?>$/mg, ''));

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
        const matched = matchers.parts.exec(fragment);
        let [, directive, body, ...rest] = matched || '';
        let parts = { fragment, directive, body, rest };
        if (directive === '!') {
            output.push('\n');
        } else if (directive) {
            try {
                const macro = new Macro(
                    directive
                        .replace(matchers.operations, 'this.$$$1')
                        .replace(matchers.interpolations, '${this.$format(this.$1)}')
                        .replace(matchers.properties, 'this.$1')
                );
                output.push(parts.result = formatBody({ directive, body: `\n${macro.call(context)}\n` }));
            } catch (exception) {
                output.push(parts.result = formatBody({ directive, body: formatException(parts.exception = exception) }));
            }
        } else {
            output.push(fragment);
        }
        log(parts); // log(matched);
    }

    const { [LINKS]: { length: links, refs } } = context;

    if (root)
        output.push(
            '\n\n<?!?>\n', context.$links(),
            `\n---\nLast Updated: ${datestamp()}`,
            '\n<?!>\n'
        );

    const result = normalizeLineBreaks(output.join(''));

    return result;
}

define(mdon, { mdon, read, write, parse, Context });

/* BOOTSTRAP */
const
    argi = argv.findIndex(arg => /[\/\\](mdon[\/\\]lib[\/\\]index\.m?js|\.bin[\/\\]mdon\~?)$/.test(arg)) || -1,
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
