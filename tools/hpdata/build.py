# -*- coding: utf-8 -*-
"""HPデータ（テキストファイルのフォルダ）から daijiten/data.js を作り、画像・音声をサイト用にコピーする。

使い方:
    python build.py <HPデータのフォルダ> <出力先（daijitenフォルダ）>
    例) python build.py "F:\\AIホームページ制作\\HPデータ" "F:\\AIホームページ制作\\HPデータ\\_出力\\daijiten"

標準のPythonだけで動きます。Pillow が入っていれば png/jpg を webp に、
ffmpeg が入っていれば長いmp3を30秒の試聴用に、自動で変換します（無くても動きます）。
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys

# ---- フォルダ名（番号_日本語_英語） ----
DIR_MUSIC = '01_音楽_music'
DIR_IMAGE = '02_画像_image'
DIR_VIDEO = '03_動画_video'
DIR_CHARA = '06_キャラ_chara'
DIR_STORY = '07_ストーリー_story'
DIR_ABOUT = '08_OPSMとは_about'
DIR_LINKS = '09_リンク_links'
DIR_TOPICS = '10_トピックス_topics'
SKIP_DIRS = {'99_未整理', '_出力'}

IMG_EXT = {'.webp', '.png', '.jpg', '.jpeg', '.gif', '.avif'}
MEDIA_EXT = IMG_EXT | {'.mp3', '.m4a', '.wav', '.mp4', '.webm'}

warnings = []


def warn(msg):
    warnings.append(msg)


# ======================================================================
# テキストの読み方
#   キー: 値            … 1行で書く項目（「：」全角でもOK）
#   【見出し】          … 次の【 】か --- までの文章をまとめて読む
#   ---                 … 一覧ファイルで、ひとつ分の区切り
#   # で始まる行        … メモ（読まない。文章の中では「# 」と空白を入れる）
# ======================================================================

KEY_RE = re.compile(r'^([^:：【#][^:：]{0,20}?)\s*[:：]\s?(.*)$')
SEC_RE = re.compile(r'^【(.+?)】\s*$')


def read_text(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        return f.read().replace('\r\n', '\n').replace('\r', '\n')


def parse_entries(text):
    entries = []
    cur = {'keys': {}, 'secs': []}
    sec = None

    def flush():
        nonlocal cur
        if cur['keys'] or cur['secs']:
            entries.append(cur)
        cur = {'keys': {}, 'secs': []}

    for line in text.split('\n'):
        if line.strip() == '---':
            sec = None
            flush()
            continue
        m = SEC_RE.match(line.strip()) if line.startswith('【') else None
        if m:
            sec = [m.group(1).strip(), []]
            cur['secs'].append(sec)
            continue
        if sec is not None:
            if not re.match(r'^#([ 　]|$)', line):  # 「# 」で始まる行はメモ
                sec[1].append(line)
            continue
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        m = KEY_RE.match(line)
        if m:
            cur['keys'][norm_key(m.group(1))] = m.group(2).strip()
        else:
            warn('読めない行（「キー: 値」の形にしてください）: ' + line.strip()[:40])
    flush()
    for e in entries:
        e['secs'] = [(norm_key(n), '\n'.join(ls).strip('\n').strip()) for n, ls in e['secs']]
    return entries


def norm_key(k):
    return re.sub(r'[\s　]', '', k)


class Entry:
    """1件分のデータ。キー行でも【見出し】でも同じように取り出せる。"""

    def __init__(self, raw, folder):
        self.keys = raw['keys']
        self.secs = raw['secs']
        self.folder = folder

    def get(self, *names):
        for n in names:
            n = norm_key(n)
            if n in self.keys:
                return self.keys[n]
            for sn, sv in self.secs:
                if sn == n:
                    return sv
        return ''

    def has(self, *names):
        return any(norm_key(n) in self.keys or any(sn == norm_key(n) for sn, _ in self.secs) for n in names)

    def lines(self, *names):
        """【見出し】なら1行に1つ、「キー: 値」なら 、 か , で区切った一覧にする。"""
        for n in names:
            n = norm_key(n)
            for sn, sv in self.secs:
                if sn == n:
                    return [x.strip() for x in sv.split('\n') if x.strip()]
        return split_list(self.get(*names))


def split_list(v):
    return [x.strip() for x in re.split(r'[、,，]', v) if x.strip()]


def read_entries(path):
    if not os.path.isfile(path):
        return []
    folder = os.path.dirname(path)
    return [Entry(r, folder) for r in parse_entries(read_text(path))]


def read_info(folder, name='info.txt'):
    es = read_entries(os.path.join(folder, name))
    if not es:
        return Entry({'keys': {}, 'secs': []}, folder)
    return es[0]


def subdirs(path):
    if not os.path.isdir(path):
        return []
    return sorted(os.path.join(path, d) for d in os.listdir(path)
                  if os.path.isdir(os.path.join(path, d)) and not d.startswith(('.', '_')))


def none_if_blank(v):
    return v if v else None


def int_or_none(v):
    v = (v or '').strip()
    if not v:
        return None
    m = re.match(r'^(\d+):(\d{1,2})$', v)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    try:
        return int(re.sub(r'[^\d]', '', v))
    except ValueError:
        warn('数字として読めません: ' + v)
        return None


# ======================================================================
# 画像・音声のコピー
# ======================================================================

class Media:
    def __init__(self, root, out):
        self.root = root
        self.out = out
        self.index = {}       # ファイル名 → [パス]
        self.done = {}        # (元パス, 出力フォルダ) → サイト上のパス
        self.taken = {}       # サイト上のパス → 中身のmd5
        self.copied = 0
        self.has_pil = None
        for dp, dns, fns in os.walk(root):
            dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.startswith(('.', '_'))]
            for fn in fns:
                if os.path.splitext(fn)[1].lower() in MEDIA_EXT:
                    self.index.setdefault(fn.lower(), []).append(os.path.join(dp, fn))

    def find(self, name, folder):
        if not name:
            return None
        p = os.path.join(folder, name)
        if os.path.isfile(p):
            return p
        hits = self.index.get(os.path.basename(name).lower(), [])
        if len(hits) > 1:
            warn('同じ名前のファイルが複数あります（最初のものを使います）: ' + name)
        if hits:
            return hits[0]
        warn('ファイルが見つかりません: ' + name + '（' + os.path.relpath(folder, self.root) + '）')
        return None

    def put(self, name, folder, kind):
        """name を探してサイト用にコピーし、サイト上のパス（例 c/xxx.webp）を返す。"""
        src = self.find(name, folder)
        if not src:
            return None
        if is_under(src, os.path.join(self.root, DIR_IMAGE)) and kind != 'a':
            kind = 'g'
        key = (src, kind)
        if key in self.done:
            return self.done[key]
        src2 = self.convert(src, kind)
        data = open(src2, 'rb').read()
        md5 = hashlib.md5(data).hexdigest()
        base = os.path.basename(src2)
        stem, ext = os.path.splitext(base)
        if not re.match(r'^[A-Za-z0-9._-]+$', base):
            base = md5[:10] + ext.lower()
        rel = kind + '/' + base
        if self.taken.get(rel, md5) != md5:
            rel = kind + '/' + stem + '_' + md5[:6] + ext.lower()
        self.taken[rel] = md5
        dst = os.path.join(self.out, kind, rel.split('/', 1)[1])
        if not (os.path.isfile(dst) and file_md5(dst) == md5):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(src2, dst)
            self.copied += 1
        self.done[key] = rel
        return rel

    def convert(self, src, kind):
        ext = os.path.splitext(src)[1].lower()
        cache = os.path.join(self.root, '_出力', '_変換キャッシュ')
        if ext in ('.png', '.jpg', '.jpeg') and kind != 'a':
            if self.has_pil is None:
                try:
                    import PIL.Image  # noqa: F401
                    self.has_pil = True
                except ImportError:
                    self.has_pil = False
                    warn('Pillow が無いので png/jpg はそのままコピーします（pip install pillow で自動webp化）')
            if not self.has_pil:
                return src
            from PIL import Image
            dst = os.path.join(cache, file_md5(src)[:10] + '.webp')
            if not os.path.isfile(dst):
                os.makedirs(cache, exist_ok=True)
                im = Image.open(src)
                im.thumbnail((1200, 1200))
                if im.mode not in ('RGB', 'RGBA'):
                    im = im.convert('RGBA')
                im.save(dst, 'WEBP', quality=82)
            return dst
        if kind == 'a' and os.path.getsize(src) > 2_500_000:
            if not shutil.which('ffmpeg'):
                warn('長い音声をそのままコピーしました（ffmpeg があれば30秒の試聴用にします）: ' + os.path.basename(src))
                return src
            dst = os.path.join(cache, file_md5(src)[:8] + '.mp3')
            if not os.path.isfile(dst):
                os.makedirs(cache, exist_ok=True)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '30', '-t', '30', '-i', src,
                                '-af', 'afade=t=in:d=1,afade=t=out:st=28:d=2', '-b:a', '64k', dst], check=True)
            return dst
        return src

    def duration(self, name, folder):
        """長さ（秒）が書かれていないとき、ffprobe があれば元の音声から測る。"""
        src = self.find(name, folder) if name else None
        if not src or not shutil.which('ffprobe'):
            return None
        try:
            r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src],
                               capture_output=True, text=True, check=True)
            return int(round(float(r.stdout.strip())))
        except Exception:
            return None


def is_under(path, folder):
    path = os.path.normcase(os.path.abspath(path))
    folder = os.path.normcase(os.path.abspath(folder))
    return path.startswith(folder + os.sep)


def file_md5(p):
    with open(p, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def image_size(path):
    with open(path, 'rb') as f:
        d = f.read(65536)
    try:
        if d[:4] == b'RIFF' and d[8:12] == b'WEBP':
            c = d[12:16]
            if c == b'VP8 ':
                w, h = struct.unpack('<HH', d[26:30])
                return w & 0x3FFF, h & 0x3FFF
            if c == b'VP8L':
                b = d[21:25]
                w = 1 + (((b[1] & 0x3F) << 8) | b[0])
                h = 1 + (((b[3] & 0xF) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6))
                return w, h
            if c == b'VP8X':
                w = 1 + int.from_bytes(d[24:27], 'little')
                h = 1 + int.from_bytes(d[27:30], 'little')
                return w, h
        if d[:8] == b'\x89PNG\r\n\x1a\n':
            return struct.unpack('>II', d[16:24])
        if d[:6] in (b'GIF87a', b'GIF89a'):
            return struct.unpack('<HH', d[6:10])
        if d[:2] == b'\xff\xd8':
            with open(path, 'rb') as f:
                f.read(2)
                while True:
                    m = f.read(2)
                    if len(m) < 2 or m[0] != 0xFF:
                        break
                    if m[1] in (0xC0, 0xC1, 0xC2):
                        f.read(3)
                        h, w = struct.unpack('>HH', f.read(4))
                        return w, h
                    ln = struct.unpack('>H', f.read(2))[0]
                    f.read(ln - 2)
    except Exception:
        pass
    warn('画像のサイズが読めません: ' + os.path.basename(path))
    return 1000, 1000


# ======================================================================
# 各コーナー
# ======================================================================

def build(root, out):
    media = Media(root, out)
    D = {}

    # ---- 曲 ----
    songs = []
    song_dirs = []
    for sd in subdirs(os.path.join(root, DIR_MUSIC)):
        if not os.path.isfile(os.path.join(sd, 'info.txt')):
            continue
        e = read_info(sd)
        folder = os.path.basename(sd)
        t = e.get('タイトル') or re.sub(r'^\d{6}_', '', folder)
        d = e.get('日付') or date_from_folder(folder)
        sid = e.get('ID') or new_song_id(folder)
        ly_path = os.path.join(sd, '歌詞.txt')
        ly = read_text(ly_path).strip('\n') if os.path.isfile(ly_path) else ''
        au_name = e.get('試聴')
        dur = int_or_none(e.get('長さ'))
        if dur is None and au_name:
            dur = media.duration(au_name, sd)
        songs.append({
            'id': sid, 'folder': folder, 't': t, 'y': e.get('よみ') or t, 'd': d,
            'cov': media.put(e.get('ジャケット'), sd, 'c'),
            'au': media.put(au_name, sd, 'a'),
            'dur': dur,
            'suno': none_if_blank(e.get('Suno')),
            'ev': e.lines('イベント'), 'tags': e.lines('タグ'),
            'ser': none_if_blank(e.get('シリーズ')),
            'note': e.get('紹介文'), 'ly': ly,
        })
        song_dirs.append(sd)
    songs.sort(key=lambda s: s['folder'])
    songs.sort(key=lambda s: s['d'], reverse=True)
    D['songs'] = songs
    ids = [s['id'] for s in songs]
    for i in set(x for x in ids if ids.count(x) > 1):
        warn('曲のIDが重なっています: ' + i)

    def song_ref(v):
        v = (v or '').strip()
        if not v:
            return None
        for s in songs:
            if v in (s['id'], s['t'], s['folder']):
                return s['id']
        warn('曲が見つかりません: ' + v)
        return None

    # ---- 画像ギャラリー ----
    gallery = []
    img_root = os.path.join(root, DIR_IMAGE)
    listed = set()
    lst = os.path.join(img_root, '画像リスト.txt')
    rows = []
    if os.path.isfile(lst):
        for line in read_text(lst).split('\n'):
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            parts = [p.strip() for p in line.split('|', 2)]
            if len(parts) < 2:
                warn('画像リストの読めない行: ' + line[:40])
                continue
            rows.append((parts[0], parts[1], parts[2] if len(parts) > 2 else ''))
    extra = []
    for dp, dns, fns in os.walk(img_root):
        dns.sort()
        for fn in sorted(fns):
            if os.path.splitext(fn)[1].lower() in IMG_EXT:
                g = os.path.relpath(dp, img_root)
                stem = os.path.splitext(fn)[0]
                extra.append(('その他' if g == '.' else g.split(os.sep)[0], fn,
                              '' if re.match(r'^[0-9a-f]{8,}$', stem) else stem))
    listed = {r[1].lower() for r in rows}
    new = [x for x in extra if x[1].lower() not in listed]
    if new:
        warn('画像リストに無い画像を %d 枚、先頭に追加しました（画像リスト.txt に書くと順番や説明を決められます）' % len(new))
    for g, fn, label in new + rows:
        src = media.find(os.path.join(g, fn), img_root) or media.find(fn, img_root)
        if not src:
            continue
        rel = media.put(src, img_root, 'g')
        w, h = image_size(os.path.join(out, rel))
        gallery.append({'f': rel, 'w': w, 'h': h, 'g': g, 'l': label})
    D['gallery'] = gallery

    # ---- ストーリー ----
    stories = []
    for sd in subdirs(os.path.join(root, DIR_STORY)):
        if not os.path.isfile(os.path.join(sd, 'info.txt')):
            continue
        e = read_info(sd)
        st = {'k': e.get('キー') or re.sub(r'^\d+_', '', os.path.basename(sd)),
              't': e.get('タイトル'), 'en': e.get('英語タイトル'), 'genre': e.get('ジャンル'),
              'since': e.get('時期'),
              'hero': media.put(e.get('メイン画像'), sd, 'h'),
              'img2': media.put(e.get('サブ画像'), sd, 'h')}
        if e.get('動画'):
            st['video'] = media.put(e.get('動画'), sd, 'v')
            st['video_cap'] = e.get('動画の説明')
        st['lead'] = e.get('リード')
        bp = os.path.join(sd, '本文.txt')
        st['body'] = [p.strip() for p in re.split(r'\n\s*\n', read_text(bp)) if p.strip()] if os.path.isfile(bp) else []
        wp = os.path.join(sd, '世界観.txt')
        st['world'] = []
        if os.path.isfile(wp):
            for ent in parse_entries(read_text(wp)):
                st['world'] += [[n, v] for n, v in ent['secs']]
        st['chars'] = e.lines('登場キャラ')
        if e.has('アルバム収録曲'):
            st['album'] = e.lines('アルバム収録曲')
        st['songs'], st['so'] = [], []
        for line in e.lines('関連曲'):
            disp, _, ref = line.partition('|')
            ref = (ref or disp).strip()
            sid = song_ref(ref)
            if sid:
                st['songs'].append(disp.strip())
                st['so'].append(sid)
        if e.get('YouTube'):
            st['yt'] = e.get('YouTube')
        st['making'] = e.lines('制作メモ')
        stories.append(st)
    D['stories'] = stories
    story_keys = {s['k']: s['k'] for s in stories}
    story_keys.update({s['t']: s['k'] for s in stories})

    def story_ref(v):
        if not v:
            return None
        if v in story_keys:
            return story_keys[v]
        warn('ストーリーが見つかりません: ' + v)
        return v

    for s in songs:
        if s['ser']:
            s['ser'] = story_ref(s['ser'])

    # ---- キャラ ----
    chars = []
    for cd in subdirs(os.path.join(root, DIR_CHARA)):
        if not os.path.isfile(os.path.join(cd, 'info.txt')):
            continue
        e = read_info(cd)
        chars.append({'n': e.get('名前') or re.sub(r'^\d+_', '', os.path.basename(cd)),
                      'y': e.get('よみ'), 'w': e.get('肩書き'),
                      'img': media.put(e.get('画像'), cd, 'g'),
                      'd': e.get('紹介'),
                      'st': story_ref(e.get('ストーリー')),
                      'so': [x for x in (song_ref(v) for v in e.lines('関連曲')) if x],
                      'c': none_if_blank(e.get('色'))})
    D['chars'] = chars

    # ---- 動画 ----
    vpub, vwip = [], []
    for vd in subdirs(os.path.join(root, DIR_VIDEO, '公開')):
        e = read_info(vd)
        vpub.append({'t': e.get('タイトル'), 'url': e.get('URL'), 'img': media.put(e.get('画像'), vd, 'h'),
                     'd': e.get('説明'), 'kind': e.get('種類'), 'so': song_ref(e.get('関連曲'))})
    for vd in subdirs(os.path.join(root, DIR_VIDEO, '制作中')):
        e = read_info(vd)
        v = {'t': e.get('タイトル'), 'st': e.get('状態'), 'img': media.put(e.get('画像'), vd, 'h'),
             'd': e.get('説明')}
        if e.get('動画'):
            v['video'] = media.put(e.get('動画'), vd, 'v')
        else:
            v['n'] = int_or_none(e.get('素材数'))
        vwip.append(v)
    D['vpub'], D['vwip'] = vpub, vwip

    # ---- OPSMとは（沿革・用語・プロジェクト） ----
    ab = os.path.join(root, DIR_ABOUT)
    D['history'] = [{'m': e.get('年月'), 'h': e.get('見出し'), 'd': e.get('説明'), 'so': song_ref(e.get('関連曲'))}
                    for e in read_entries(os.path.join(ab, '沿革.txt'))]
    tp = os.path.join(root, DIR_TOPICS)
    D['activity'] = [{'d': e.get('日付'), 'c': e.get('分類'), 't': e.get('タイトル'), 'x': e.get('本文'),
                      'href': none_if_blank(e.get('リンク')), 'img': media.put(e.get('画像'), e.folder, 'h')}
                     for e in read_entries(os.path.join(tp, 'お知らせ.txt'))]
    D['gloss'] = [{'t': e.get('用語'), 'y': e.get('よみ'), 'd': e.get('説明')}
                  for e in read_entries(os.path.join(ab, '用語集.txt'))]
    D['proj'] = [{'t': e.get('名前'), 'k': e.get('種類'), 'd': e.get('説明')}
                 for e in read_entries(os.path.join(ab, 'プロジェクト.txt'))]
    D['links'] = [{'n': e.get('名前'), 'h': e.get('ハンドル'), 'u': e.get('URL'), 'd': e.get('説明')}
                  for e in read_entries(os.path.join(root, DIR_LINKS, 'リンク.txt'))]
    D['ads'] = [{'k': e.get('ラベル'), 't': e.get('タイトル'), 's': e.get('ひとこと'),
                 'img': media.put(e.get('画像'), e.folder, 'h'), 'href': e.get('リンク'), 'tone': e.get('色')}
                for e in read_entries(os.path.join(tp, 'バナー.txt'))]

    # ---- 数字 ----
    conf = read_info(ab, 'サイト設定.txt')
    built = datetime.date.today().isoformat()
    start = conf.get('活動開始') or '2025-06'
    months = int_or_none(conf.get('活動月数'))
    if months is None:
        y0, m0 = map(int, start.split('-')[:2])
        months = (int(built[:4]) - y0) * 12 + int(built[5:7]) - m0 + 1
    D['stats'] = {'songs': len(songs), 'audio': sum(1 for s in songs if s['au']), 'images': len(gallery),
                  'clips': int_or_none(conf.get('動画素材の数')) or 0, 'chars': len(chars),
                  'stories': len(stories), 'months': months}
    D['built'] = built

    os.makedirs(out, exist_ok=True)
    js = 'window.D=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';'
    with open(os.path.join(out, 'data.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    return D, media


def date_from_folder(folder):
    m = re.match(r'^(\d\d)(\d\d)(\d\d)', folder)
    if not m:
        return ''
    y, mo, d = m.groups()
    return '20%s-%s' % (y, mo) + ('' if d == '00' else '-' + d)


def new_song_id(folder):
    m = re.match(r'^(\d{6})', folder)
    return 's' + (m.group(1) if m else '000000') + hashlib.md5(folder.encode('utf-8')).hexdigest()[:3]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    root = os.path.abspath(sys.argv[1])
    out = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(root, '_出力', 'daijiten')
    D, media = build(root, out)
    print('できました → ' + os.path.join(out, 'data.js'))
    print('  曲 %d（試聴 %d）・画像 %d・キャラ %d・ストーリー %d・動画 %d+%d・お知らせ %d' % (
        len(D['songs']), D['stats']['audio'], len(D['gallery']), len(D['chars']), len(D['stories']),
        len(D['vpub']), len(D['vwip']), len(D['activity'])))
    print('  新しくコピーした画像・音声: %d 個' % media.copied)
    if warnings:
        print('\n【確認してほしいこと】')
        for w in dict.fromkeys(warnings):
            print('  ・' + w)


if __name__ == '__main__':
    main()
