#!/usr/bin/env node --

/* Dependencies */
const fs = require('fs'), path = require('path');

/* Exports */
module.exports = mdon;

/* Settings */
const defaults = { output: true, backup: false }, // '.out'
    debugging = ['', { parse: true, fragments: false, print: true, output: true }][+false];

/* Imports */
const { assign: define, entries: entriesOf } = Object,
    { readFileSync, existsSync, writeFileSync, renameSync } = fs,
    { resolve, dirname, basename, relative, parse: parsePath, format: formatPath, ext: extname, sep: pathsep } = path;

/* Definitions */
const [READ, PARSE, LINKS] = ['READ', 'PARSE', 'LINKS'].map(Symbol), // Symbol('MDon::Links'),
    matchers = {
        alias: /^[a-z0-9]+(\-[a-z0-9]+)*$/,
        interpolations: /\$\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}/g,
        operations: /\@(\w+)/g,
        properties: /\{\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}\}/g,
        fragments: /^(<\?[ \t]*.*?\?>[ \t]*\n(?:(?:.*?\n)*?|)(?:<\?\!)>[ \t]*|<\!--\?[ \t]*.*?\?-->[ \t]*\n(?:(?:.*?\n)*?|)(?:<\!--\?\!)-->[ \t]*)$/m,
        parts: /^(?:(?:<\!--|<)\?[ \t]*(.*?)[ \t]*\?(?:-->|>)|)([ \t]*\n(?:.*?\n)*?)(?:<\?\!>|<\!--\?\!-->|)$/m,
        shorttags: /^<(\?.*?[^-])>$/mg,
        arg: /[\/\\](mdon[\/\\]lib[\/\\]index\.m?js|\.bin[\/\\]mdon\~?)$/,
    },
    datestamp = ['en-US', {
        timeZone: 'GMT', timeZoneName: 'short',
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    }];


/* Helpers */
const
    VOID = Object.create(null), NOOP = (() => VOID),
    typeguard = (type, value, fallback) => typeof value === type ? value : fallback,
    callable = typeguard.bind(null, 'function'),
    object = typeguard.bind(null, 'object'),
    string = typeguard.bind(null, 'string');

let
    { stdout, argv = [], hrtime, cwd } = typeof process !== 'undefined' && process || VOID,
    { now = (
        callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)
    ) || Date.now } = typeof performance !== 'undefined' && performance || VOID;

const columns = stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80;
cwd = callable(cwd) ? cwd() : '.';

const normalizeAlias = value => matchers.alias.test((value = string(value, '').toLowerCase())) && value || '';

/* Prototypes */

/** Low-overhead (less secure) sandbox suitable for evaluating directives. */
function Macro(directive) {
    const { operations, interpolations, properties } = matchers;
    return Function.prototype.call.bind(new Function('context', 'global', 'require', 'process', 'module', 'exports', `return ${
        directive
            .replace(operations, 'context.$$$1')
            .replace(interpolations, '${context.$format(context.$1)}')
            .replace(properties, 'context.$1')
        };`), null);
}

class Base {
    constructor() {
        this.$ = this, this.log = new Proxy(console.log, {
            get: (log, scope) => (log[scope] || (log[scope] = (debugging[scope] ? log : NOOP)))
        });
    }
}; Base.prototype.log = console.log;

class Context extends Base {
    constructor(properties, path) {
        super(); define(this, properties, { path });
        this[LINKS] = {
            refs: {}, aliases: {}, length: 0, toString() {
                const entries = this.length && entriesOf(this.refs), result = [];
                for (let i = 0, n = entries.length; i < n; i++)
                    result.push(`[${entries[i][0]}]: ${entries[i][1]}`);
                return result.length ? result.join('\n') + '\n' : '';
            }
        };
    }

    $format(string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`
    }

    $resolve(ref) {
        const path = resolve(this.path, `./${ref}`);
        return existsSync(path) && path;
    }

    $alias(ref, prefix = 'link') {
        if (!(ref = string(ref, '').trim()))
            throw Error(`Cannot create alias from reference: ${arguments[0]}`);
        else if (!(prefix = normalizeAlias(prefix))) // typeof prefix !== 'string' || !(prefix = prefix.trim()) || /[a-z]+(\-[a-z]+)+/.test(prefix = prefix.toLowerCase()))
            throw Error(`Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`);

        let alias = this[LINKS].aliases[ref];

        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = normalizeAlias(`${prefix}-${++links.length}`)] = ref;
        }

        return alias;
    }

    $ref(alias) {
        if (!(alias = normalizeAlias(alias)))
            throw Error(`Cannot create reference from alias: ${arguments[0]}`);

        const { [LINKS]: { refs: { [alias]: ref } } } = this;

        if (!string(ref))
            throw Error(`Cannot find reference from alias ${arguments[0]}.`);

        return ref;
    }

    $exists(ref) {
        return this.$format(relative(this.path, this.$resolve(ref)));
    }

    $include(ref) {
        const content = this[READ](this.$resolve(ref));
        return matchers.fragments.test(content)
            ? this.$parse(content)
            : this.$format(content)
    }

    $parse(md) {
        return this.$format(this[PARSE](this, md, false));
    }

}

/** Exposes root, package.json fields, and file operations. */
class Package extends Base {
    constructor(path = '.') {
        super();
        const filename = resolve(string(path, '').replace(/[\\\/]package\.json$/i, ''), 'package.json');
        const root = dirname(filename), info = JSON.parse(this.read(filename));
        define(this, {
            root, filename, info, resolve: this.resolve.bind(null, root),
            read: this.read.bind(this), write: this.write.bind(this)
        });
    }

    read(filename) {
        filename = this.resolve(filename);
        return readFileSync(this.resolve(filename)).toString();
    }

    readUntil(file, until = /[\n\r]/, length = 128, position = 0, contents = '', buffer = new Buffer(length)) {
        if (string(file)) file = fs.openSync(this.resolve(file), 'r');
        fs.readSync(file, buffer, 0, length, position);
        contents += buffer.toString();
        return until.test(contents)
            ? (fs.closeSync(file), contents.split(until)[0])
            : this.readUntil(file, until, length, position += length, contents, buffer);
    }

    write(filename, contents, { flag = 'w', backup = defaults.backup, ...options } = {}) {
        filename = this.resolve(filename);
        backup && this.backup(filename);
        return writeFileSync(filename, contents, { flag, ...options });
    }

    backup(filename, i = 0) {
        filename = this.resolve(filename);
        while (existsSync(filename)) filename = `${arguments[0]}.${i++}`;
        return i > 0 ? (fs.renameSync(arguments[0], filename)) : null;
    }
}; Package.prototype.resolve = resolve;

/** Exposes normalize, fragment, parse, format, and print operations. */
class Compiler extends Base {
    constructor() {
        super();
        for (const method of ['fragment', 'parse', 'format', 'print'])
            this[method] = this[method].bind(this);
    }

    fragment(source) {
        const raw = this.normalize(source);
        const fragments = raw.split(matchers.fragments);
        this.log.fragments(fragments); // ['fragments:', ...fragments].join(`\n${'-'.repeat(columns)}\n`), ...pagebreak);
        return fragments;
    }

    normalize(source) {
        if (!string(source, '')) return source;
        const normalize = Compiler.prototype.normalize, {
        all = normalize.all = /(\r\n|\n|\r)/mg,
            extra = normalize.extra = /(\n)(\s*\n)+/gm
    } = normalize;
        return source.replace(all, '\n').replace(extra, '$1$1');
    }

    format({ directive = '!', body, exception }) {
        body = string(body) || '\n';
        if (directive && exception)
            body += `<!-- \`${(string(exception) || string(exception.message) || 'FAILED!')}\` -->\n`;
        return string(directive) ? `<? ${directive} ?>${body}<?!>` : body;
    }

    parse(context, source, root = true) {
        const fragments = this.fragment(string(source, ''));

        if (!fragments.length || !context) return output;

        const output = [], push = output.push.bind(output);

        for (const fragment of fragments) {
            const [, directive, body, ...rest] = matchers.parts.exec(fragment) || '';
            const parts = { fragment, directive, body, rest };

            if (directive === '!') push('\n');
            else if (!directive) push(fragment)
            else try {
                push(parts.result = this.format({ directive, body: `\n${Macro(directive)(context)}\n` }));
            } catch (exception) {
                push(parts.result = this.format({ directive, exception }));
            }
            this.log.parts(parts);
        }

        if (root) output.push(
            '\n\n<?!?>\n', context[LINKS],
            `\n---\nLast Updated: ${new Date().toLocaleString(...datestamp)}`,
            '\n<?!>\n'
        );

        return this.normalize(output.join(''));
    }

    print(contents, filename) {
        if (!string(contents)) return;

        const pagebreak = '-'.repeat(columns),
            header = string(filename) ? [`FILE  | ${filename}`, `------|${pagebreak.slice(7)}`] : [],
            body = contents.split('\n').map((l, i) => `${`${++i}`.padStart(5, '     ')} | ${l}`);

        this.log.print([pagebreak].concat(header, body, pagebreak).join('\n'));
    }

}

/* API */
function mdon(pkgpath = '', mdpath = './README.md', outpath = defaults.output) {

    const pkg = new Package(pkgpath), { resolve, read, write, root, info } = pkg;
    const { parse, print, log } = new Compiler();

    mdpath = pkg.resolve(string(mdpath));

    const mddir = dirname(mdpath);
    const firstLine = pkg.readUntil(mdpath, /(?:([\?\@\!])(--)?>)/) || '';
    const [, rawpath] = /(?:<\!--\@)(.*?)$/.exec(firstLine) || ''; // resolve(dirname(mdpath), 'docs', basename(mdpath));
    let mdrawpath = rawpath && resolve(mddir, rawpath) || '';
    if (!mdrawpath || !existsSync(mdrawpath)) mdrawpath = mdpath;

    const mdin = read(mdrawpath);
    const started = now();
    const context = new Context({ ...info, [READ]: read, [PARSE]: parse }, root);
    let mdout = parse(context, mdin);
    const elapsed = now() - started;

    if (rawpath)
        mdout = `<!--@${rawpath}@-->\n${mdout.replace(matchers.shorttags, '<!--$1-->')}`; // .replace(/^<\!--\@.*?\@-->\n?/mg, '')

    if (debugging.rounttrips > 0)
        for (let i = 0, { rounttrips: n } = debugging; i < n; i++)
            mdout = parse(mdout, context);

    outpath = outpath && (
        outpath === true ? mdpath : /^\.\w+$/.test(outpath) && mdpath.replace(/(\..*?$)/, `${outpath}$1`)
    ) || false;

    if (outpath && (!debugging || debugging.output)) write(outpath, mdout);
    print(mdout, outpath), log(`MDon: ${mdpath} done in ${elapsed.toFixed(1)} ms`); // console.log({ mdpath, rawpath, outpath });

    return mdout;
}

(class CLI extends Base {
    static get args() {
        let i; return this._args = this._args || (i = argv.findIndex(arg => matchers.arg.test(arg))) > -1 && argv.slice(i + 1) || null;
    }
    static bootstrap() {
        // const { argv0, execPath, execArgv } = process;
        // console.log({ argv, argv0, execPath, execArgv });
        if (!this.args) return;
        const { args } = this,
            options = { p: '', m: [], o: defaults.output, b: null },
            push = (k, arg) => options[k].push ? options[k].push(arg) : options[k] = options[k] || arg,
            flagLike = /^(-\w|--\w+(\-\w+))/, pathLike = /[\.\\\/]/, fileLike = /\w+\.\w+$/, extLike = /^\.\w+$/;
        for (let i = 0, arg, k = ''; arg = args[i], i < args.length; i++) {
            flagLike.test(arg) ? (
                k = (k = /\w/.exec(arg)[0]) in options ? (k) : '',
                options[k] === null && (options[k] = true, k = '')
            ) : k ? (push(k, arg), k === 'm' || (k = ''))
                    : pathLike.test(arg) && (
                        extLike.test(arg) ? push('o', arg)
                            : !fileLike.test(arg) ? push('p', resolve(arg))
                                : push('m', resolve(arg))
                    );
        } // console.log({ ...options });
        const files = options.m.length ? options.m : [undefined], pkg = string(options.p), out = string(options.o);
        for (let file of files) mdon(pkg, file, out);
    }
}).bootstrap();
