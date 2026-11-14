# -*- coding: utf-8 -*-
"""（最初の一回だけ使う）今の daijiten/data.js を HPデータ のテキストファイルに書き出す。

    python export_from_datajs.py <daijitenフォルダ> <書き出し先HPデータ>
"""
import json
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import (DIR_ABOUT, DIR_CHARA, DIR_IMAGE, DIR_LINKS, DIR_MUSIC, DIR_STORY,  # noqa: E402
                   DIR_TOPICS, DIR_VIDEO)

BAD = re.compile(r'[\\/:*?"<>|]')


def safe(name):
    return BAD.sub('_', name).rstrip('. ')[:60]


def load(site):
    js = open(os.path.join(site, 'data.js'), encoding='utf-8').read()
    return json.loads(js[js.index('=') + 1:].rstrip().rstrip(';'))


def kv(label, v):
    return '%s: %s' % (label, '' if v is None else v)


def sec(label, text):
    return '【%s】\n%s\n' % (label, text or '')


def write(path, lines):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines).rstrip('\n') + '\n')


def main(site, root):
    D = load(site)
    gallery_names = {g['f'].split('/', 1)[1]: g['g'] for g in D['gallery']}
    song_t = {s['id']: s['t'] for s in D['songs']}
    placed = {}

    def media(path, folder):
        """ファイルをテキストの横に置いて、info.txt に書くファイル名を返す。"""
        if not path:
            return ''
        name = path.split('/', 1)[1]
        if path.startswith('g/') and name in gallery_names:
            return name  # 画像フォルダにあるものはファイル名だけで指せる
        if name not in placed:
            os.makedirs(folder, exist_ok=True)
            shutil.copyfile(os.path.join(site, path), os.path.join(folder, name))
            placed[name] = folder
        return name

    def st(sid):
        return song_t.get(sid, sid) if sid else ''

    # 曲
    for s in D['songs']:
        sd = os.path.join(root, DIR_MUSIC, safe(s['folder']))
        assert safe(s['folder']) == s['folder'], s['folder']
        write(os.path.join(sd, 'info.txt'), [
            kv('タイトル', s['t']), kv('よみ', s['y']), kv('日付', s['d']),
            kv('タグ', '、'.join(s['tags'])), kv('イベント', '、'.join(s['ev'])),
            kv('シリーズ', s['ser']), kv('ジャケット', media(s['cov'], sd)), kv('試聴', media(s['au'], sd)),
            kv('長さ', s['dur']), kv('Suno', s['suno']),
            '# ↓サイトの中で使う番号。変えないでください（新しい曲は空でOK）', kv('ID', s['id']), '', sec('紹介文', s['note'])])
        if s['ly']:
            write(os.path.join(sd, '歌詞.txt'), [s['ly']])

    # 画像
    lines = ['# 画像ギャラリーの一覧（上から順に表示）', '# グループ | ファイル名 | 説明',
             '# 画像は 02_画像_image\\グループ名\\ の中に置きます', '']
    for g in D['gallery']:
        name = g['f'].split('/', 1)[1]
        d = os.path.join(root, DIR_IMAGE, safe(g['g']))
        os.makedirs(d, exist_ok=True)
        shutil.copyfile(os.path.join(site, g['f']), os.path.join(d, name))
        lines.append('%s | %s | %s' % (g['g'], name, g['l']))
    write(os.path.join(root, DIR_IMAGE, '画像リスト.txt'), lines)

    # ストーリー
    for i, s in enumerate(D['stories'], 1):
        sd = os.path.join(root, DIR_STORY, '%02d_%s' % (i, safe(s['t'])))
        rel = []
        for disp, sid in zip(s['songs'], s['so']):
            rel.append(disp if disp == song_t.get(sid) else '%s | %s' % (disp, song_t.get(sid, sid)))
        L = [kv('キー', s['k']), kv('タイトル', s['t']), kv('英語タイトル', s['en']), kv('ジャンル', s['genre']),
             kv('時期', s['since']), kv('メイン画像', media(s['hero'], sd)), kv('サブ画像', media(s['img2'], sd)),
             kv('動画', media(s.get('video'), sd)), kv('動画の説明', s.get('video_cap', '')),
             kv('YouTube', s.get('yt', '')), '',
             sec('リード', s['lead']), sec('登場キャラ', '\n'.join(s['chars'])),
             '# 曲名だけ書けばOK。表示名を変えたいときは「表示名 | 曲名」', sec('関連曲', '\n'.join(rel))]
        if 'album' in s:
            L.append(sec('アルバム収録曲', '\n'.join(s['album'])))
        L.append(sec('制作メモ', '\n'.join(s['making'])))
        write(os.path.join(sd, 'info.txt'), L)
        write(os.path.join(sd, '本文.txt'), ['\n\n'.join(s['body'])])
        write(os.path.join(sd, '世界観.txt'), ['# 【見出し】の下に説明を書きます', ''] +
              [sec(a, b) for a, b in s['world']])

    # キャラ
    for i, c in enumerate(D['chars'], 1):
        cd = os.path.join(root, DIR_CHARA, '%02d_%s' % (i, safe(c['n'])))
        write(os.path.join(cd, 'info.txt'), [
            kv('名前', c['n']), kv('よみ', c['y']), kv('肩書き', c['w']), kv('画像', media(c['img'], cd)),
            kv('色', c['c']), kv('ストーリー', c['st']), '', sec('紹介', c['d']),
            sec('関連曲', '\n'.join(st(x) for x in c['so']))])

    # 動画
    for i, v in enumerate(D['vpub'], 1):
        vd = os.path.join(root, DIR_VIDEO, '公開', '%02d_%s' % (i, safe(v['t'])))
        write(os.path.join(vd, 'info.txt'), [
            kv('タイトル', v['t']), kv('URL', v['url']), kv('種類', v['kind']), kv('画像', media(v['img'], vd)),
            kv('関連曲', st(v['so'])), '', sec('説明', v['d'])])
    for i, v in enumerate(D['vwip'], 1):
        vd = os.path.join(root, DIR_VIDEO, '制作中', '%02d_%s' % (i, safe(v['t'])))
        write(os.path.join(vd, 'info.txt'), [
            kv('タイトル', v['t']), kv('状態', v['st']), kv('画像', media(v['img'], vd)),
            kv('動画', media(v.get('video'), vd)), kv('素材数', v.get('n')), '', sec('説明', v['d'])])

    # OPSMとは
    ab = os.path.join(root, DIR_ABOUT)
    write(os.path.join(ab, '沿革.txt'), ['# ひとつ分ごとに --- で区切ります', ''] + sum(
        [[kv('年月', h['m']), kv('見出し', h['h']), kv('関連曲', st(h['so'])), sec('説明', h['d']), '---']
         for h in D['history']], []))
    write(os.path.join(ab, '用語集.txt'), ['# ひとつ分ごとに --- で区切ります', ''] + sum(
        [[kv('用語', g['t']), kv('よみ', g['y']), sec('説明', g['d']), '---'] for g in D['gloss']], []))
    write(os.path.join(ab, 'プロジェクト.txt'), ['# ひとつ分ごとに --- で区切ります', ''] + sum(
        [[kv('名前', p['t']), kv('種類', p['k']), sec('説明', p['d']), '---'] for p in D['proj']], []))
    write(os.path.join(ab, 'サイト設定.txt'), [
        '# トップなどに出る数字のうち、自動で数えられないもの',
        kv('動画素材の数', D['stats']['clips']),
        '# 活動の月数は「活動開始」から今日までで自動計算（数字を書けばそれを使います）',
        kv('活動開始', '2025-06'), kv('活動月数', '')])

    # リンク
    write(os.path.join(root, DIR_LINKS, 'リンク.txt'), ['# ひとつ分ごとに --- で区切ります', ''] + sum(
        [[kv('名前', x['n']), kv('ハンドル', x['h']), kv('URL', x['u']), kv('説明', x['d']), '---']
         for x in D['links']], []))

    # トピックス
    tp = os.path.join(root, DIR_TOPICS)
    imgd = os.path.join(tp, '画像')
    write(os.path.join(tp, 'お知らせ.txt'), ['# 新しいものを上に。ひとつ分ごとに --- で区切ります', '# 画像は「画像」フォルダに置いてファイル名を書きます', ''] + sum(
        [[kv('日付', a['d']), kv('分類', a['c']), kv('タイトル', a['t']), kv('リンク', a['href']),
          kv('画像', media(a['img'], imgd)), sec('本文', a['x']), '---'] for a in D['activity']], []))
    write(os.path.join(tp, 'バナー.txt'), ['# トップに並ぶバナー。上から順に表示。ひとつ分ごとに --- で区切ります', ''] + sum(
        [[kv('ラベル', a['k']), kv('タイトル', a['t']), kv('ひとこと', a['s']), kv('画像', media(a['img'], imgd)),
          kv('リンク', a['href']), kv('色', a['tone']), '---'] for a in D['ads']], []))
    print('書き出しました:', root)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
