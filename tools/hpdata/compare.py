# -*- coding: utf-8 -*-
"""2つの data.js が同じ中身か確かめる（画像・音声はファイルの中身で比べる）。
    python compare.py <元のdaijiten> <新しいdaijiten>
"""
import hashlib, json, os, re, sys

def load(site):
    js = open(os.path.join(site, 'data.js'), encoding='utf-8').read()
    return json.loads(js[js.index('=') + 1:].rstrip().rstrip(';'))

def norm(o, site):
    if isinstance(o, dict):
        return {k: norm(v, site) for k, v in o.items() if v is not None and k != 'built'}
    if isinstance(o, list):
        return [norm(v, site) for v in o]
    if isinstance(o, str) and re.match(r'^[cghav]/[^ ]+\.\w+$', o) and os.path.isfile(os.path.join(site, o)):
        return 'FILE:' + hashlib.md5(open(os.path.join(site, o), 'rb').read()).hexdigest()
    return o

def diff(a, b, p, out):
    if type(a) != type(b):
        out.append((p, a, b)); return
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            diff(a.get(k), b.get(k), p + '.' + k, out)
    elif isinstance(a, list):
        if len(a) != len(b):
            out.append((p + ' (len)', len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)):
            diff(x, y, '%s[%d]' % (p, i), out)
    elif a != b:
        out.append((p, a, b))

A, B = sys.argv[1], sys.argv[2]
a, b = norm(load(A), A), norm(load(B), B)
out = []
diff(a, b, 'D', out)
for p, x, y in out[:40]:
    print(p, '|', str(x)[:80], '|', str(y)[:80])
print('ちがい:', len(out))
pa = sum(1 for _ in re.finditer(r'"[cghav]/', open(os.path.join(B, 'data.js'), encoding='utf-8').read()))
