/// <reference types="node" />
declare const defaults: {
    backup: boolean;
    safe: boolean;
    output: boolean;
}, debugging: indexable<boolean | undefined>;
declare const fs: any, path: any, define: {
    <T, U>(target: T, source: U): T & U;
    <T, U, V>(target: T, source1: U, source2: V): T & U & V;
    <T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    (target: object, ...sources: any[]): any;
}, entriesOf: {
    <T>(o: {
        [s: string]: T;
    }): [string, T][];
    (o: any): [string, any][];
}, getPrototypeOf: (o: any) => any, setPrototype: (o: any, proto: object) => any, readFileSync: any, existsSync: any, writeFileSync: any, renameSync: any, resolve: any, dirname: any, basename: any, relative: any, parsePath: any, extname: any;
declare const READ: symbol, PARSE: symbol, LINKS: symbol, matchers: {
    alias: RegExp;
    interpolations: RegExp;
    operations: RegExp;
    properties: RegExp;
    fragments: RegExp;
    parts: RegExp;
    shorttags: RegExp;
    suffix: RegExp;
    arg: RegExp;
    linebreaks: RegExp;
    extranousLinebreaks: RegExp;
}, errors: {
    alreadySuffixed: (filename: string, suffix: string, abort?: boolean, reason?: string) => Error & {
        reason: string;
        filename: string;
        suffix: string;
        abort: boolean;
    };
    invalidSuffix: (suffix: string, abort?: boolean, reason?: string) => Error & {
        reason: string;
        suffix: string;
        abort: boolean;
    };
    invalidCallingContext: (method?: string) => Error;
    invalidArgument: (method: string, argument: string, value: any, reason?: string) => Error;
}, timestamp: Intl.DateTimeFormatOptions & {
    locale?: string;
};
interface Guard<T = any> {
    (value: T | any): T | undefined;
    <T>(value: T | any): T | undefined;
    <F>(value: T | any, fallback?: F): T | F;
    <T, F>(value: T | any, fallback?: F): T | F;
}
declare const VOID: any, NOOP: (...args: any[]) => any, ANY: (type: any) => boolean, prototypeOf: (value: any) => any, typeguard: (type: any, value: any, fallback: any) => any, callable: any, object: Guard<object> & {
    flat: Guard<object>;
}, boolean: any, string: any, stdout: any, argv: any[], hrtime: any, columns: number, now: (t?: any) => number, bind: (object: any, ...methods: string[]) => void, reconcile: any, normalizeAlias: (value: any) => any;
interface Any {
}
interface Tryable<T = any> extends Any {
    (): T;
    name: undefined;
    length: 0;
}
declare type Reconcilable<T = any, ƒ extends Tryable = Tryable<T>> = (ƒ | {
    try: ƒ;
}) & Partial<ƒ & {
    try: ƒ;
}>;
declare const yaml: any;
declare class Macro extends Function {
    directive: string;
    constructor(directive: string);
}
declare type Logger<M extends keyof Console = 'log'> = Console[M] & indexable<Console[M] & indexable<Console[M]>>;
declare class Base {
    $: this;
    log: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    } & indexable<{
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    }>;
    warn: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
}
declare class Context extends Base {
    path?: string;
    src: string;
    document?: indexable<any>;
    wrappers: WeakMap<object, any>;
    readonly cwd: any;
    constructor(properties: object, path: string);
    wrap(wrapper?: object): any;
    $timestamp(date?: string | number | Date, {locale, ...options}?: indexable<any>): string;
    $format(string: string): string;
    $resolve(path: string, base?: boolean | string): string;
    $exists(path: string): string;
    $include(path: string): string;
    $parse(markdown: string, context?: this): string;
    $alias(ref: string, prefix?: string): any;
    $ref(alias: string): any;
}
declare class Package extends Base {
    resolve: any;
    root: string;
    info: indexable<any>;
    constructor(path?: string);
    read(filename: string): any;
    readUntil(file: string | number, until?: RegExp, length?: number, position?: number, contents?: string, buffer?: Buffer): any;
    write(filename: string, contents: string, {flag, backup, ...options}?: {
        flag?: string;
        backup?: boolean;
    }): any;
    backup(filename: string, i?: number): any;
}
declare class Compiler extends Base {
    constructor();
    fragment(source: string): string[];
    normalize(source: string): string;
    format(fragment: {
        directive?: string;
        body?: string;
        exception?: {
            message?: string;
        };
    }): string;
    parse(context: Context, source: string, root?: boolean): string;
    pretty(contents: string, filename?: string, starting?: number, title?: string): string;
}
interface Path {
    root: string;
    dir: string;
    name: string;
    ext: string;
    base: string;
    suffix?: string;
    path: string;
    intended?: string;
    resolved?: string;
    raw?: string;
    out?: string;
    [name: string]: string;
}
declare function mdon(pkgpath?: string, mdpath?: string, outpath?: string | boolean): any;
