#!/usr/bin/env python3
"""Builds index.html from the files in src/ and lib/.
Usage:  python tools/build.py            writes index.html with the PDF/Excel libraries built in (works offline)
        python tools/build.py --cdn      loads the libraries from the internet instead (smaller file)
        python tools/build.py --check    fails if index.html is out of date with src/ and lib/"""
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
LIBS = [('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', 'jspdf-2.5.1.umd.min.js'),
        ('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js', 'jspdf-autotable-3.8.2.min.js'),
        ('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'xlsx-0.18.5.full.min.js')]
cdn = '--cdn' in sys.argv
def build():
    u = read('page.html')
    u = u.replace('/*__RECT_HTML__*/', read('rect-form.html'))
    u = u.replace('</style>', css, 1)
    engines = '\n'.join(strip(read(f)) for f in ['standards.js', 'engine-round.js', 'engine-rect.js', 'guarantees.js'])
    u = u.replace('/*__ENGINE__*/', engines)
    i = u.index('<script>\nconst $=')
    u = u[:i] + '<script>\n' + read('drawing.js') + '\n' + read('validation.js') + '\n' + read('extras.js') + '\n</script>\n' + u[i:]
    if not cdn:
        # Build the PDF and Excel libraries into the page so downloads work without internet
        for url, f in LIBS:
            tag = '<script src="' + url + '"></script>'
            assert tag in u, 'library tag missing: ' + url
            code = (root / 'lib' / f).read_text(encoding='utf-8')
            assert '</script' not in code.lower(), f + ' contains a closing script tag'
            u = u.replace(tag, '<script>/* ' + f + ' (built in for offline use) */\n' + code + '\n</script>')
    marker = "loadPreset('p500');\n</script>"
    assert marker in u, 'page.html marker missing'
    u = u.replace(marker, marker + '\n<script>\n' + read('ui-rect.js') + '\n</script>\n<script>\n' + read('ui-round-extra.js') + '\n</script>')
    assert '/*__' not in u, 'unreplaced placeholder'
    return u
out = build()
target = root / 'index.html'
if '--check' in sys.argv:
    if not target.exists() or target.read_text(encoding='utf-8') != out:
        print('index.html is out of date with src/. Run:  python tools/build.py  and commit index.html.'); sys.exit(1)
    print('index.html matches src/'); sys.exit(0)
target.write_text(out, encoding='utf-8'); print('built index.html,', round(len(out.encode('utf-8'))/1e6, 2), 'MB,', 'libraries from the internet' if cdn else 'libraries built in (works offline)')
