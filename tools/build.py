#!/usr/bin/env python3
"""Builds index.html from the files in src/.  Usage:  python tools/build.py          (writes index.html)
                                                          python tools/build.py --check  (fails if index.html is out of date)"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
read = lambda n: (src / n).read_text(encoding='utf-8')
strip = lambda s: re.sub(r"if\(typeof module!=='undefined'\).*$", "", s, flags=re.M)
css = '''.grid4{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.2fr;gap:8px}
.pair{display:flex;gap:4px}.pair input,.pair select{min-width:0}
.subhead{font-size:13px;font-weight:600;margin:10px 0 4px;color:var(--ink)}
.filebtn{display:inline-flex;align-items:center;cursor:pointer;color:var(--ink);flex-direction:row}
.filebtn:focus-within{outline:3px solid var(--accent);outline-offset:2px}
.saved{border:1px solid var(--rule);padding:8px 10px 10px;margin-bottom:12px;background:var(--bg)}
.saved .subhead{margin-top:0}
.saverow{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:6px}.saverow.three{grid-template-columns:1fr auto auto}.saverow.two{grid-template-columns:1fr 1fr}.saverow.one{grid-template-columns:1fr}.saverow input,.saverow select{min-width:0;width:100%}.saverow .btn{white-space:nowrap}
</style>'''
def build():
    u = read('page.html')
    u = u.replace('/*__RECT_HTML__*/', read('rect-form.html'))
    u = u.replace('</style>', css, 1)
    engines = '\n'.join(strip(read(f)) for f in ['standards.js', 'engine-round.js', 'engine-rect.js', 'guarantees.js'])
    u = u.replace('/*__ENGINE__*/', engines)
    i = u.index('<script>\nconst $=')
    u = u[:i] + '<script>\n' + read('drawing.js') + '\n</script>\n' + u[i:]
    marker = "loadPreset('p500');\n</script>"
    assert marker in u, 'page.html marker missing'
    u = u.replace(marker, marker + '\n<script>\n' + read('ui-rect.js') + '\n</script>')
    assert '/*__' not in u, 'unreplaced placeholder'
    return u
out = build()
target = root / 'index.html'
if '--check' in sys.argv:
    if not target.exists() or target.read_text(encoding='utf-8') != out:
        print('index.html is out of date with src/. Run:  python tools/build.py  and commit index.html.'); sys.exit(1)
    print('index.html matches src/'); sys.exit(0)
target.write_text(out, encoding='utf-8'); print('built index.html,', len(out), 'characters')
