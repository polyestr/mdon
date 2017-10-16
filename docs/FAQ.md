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

