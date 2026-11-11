(function(){
'use strict';
const D = window.D;
const BASE = 'daijiten/';

/* 大辞典のデータをそのまま使う。素材パス（a/ c/ g/ h/ v/）は daijiten/ 配下を指すようにする */
(function fix(o){
  for (const k in o){
    const v = o[k];
    if (typeof v === 'string' && /^[acghv]\/[^/]+\.(webp|png|jpe?g|mp3|mp4)$/i.test(v)) o[k] = BASE + v;
    else if (v && typeof v === 'object') fix(v);
  }
})(D);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const songById = Object.fromEntries(D.songs.map(s => [s.id, s]));
const storyByK = Object.fromEntries(D.stories.map(s => [s.k, s]));
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const isExt = h => /^https?:/.test(h);
const tgt = h => isExt(h) ? ' target="_blank" rel="noopener"' : '';
const app = $('#app');
const SITE = 'OPSM ROULETTE｜おぽのAI創作';

function fmtD(d){ const p = d.split('-'); return p.length === 3 ? `${p[0]}.${p[1]}.${p[2]}` : `${p[0]}.${p[1]}`; }
function hue(s){ let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) % 360; return h; }
function ph(t){ const h = hue(t); return `<div class="ph" style="background:linear-gradient(135deg,hsl(${h} 45% 38%),hsl(${(h+60)%360} 40% 18%))"><span>${esc(t)}</span></div>`; }
function coverHTML(s, lazy = true){ return s.cov ? `<img src="${s.cov}" alt="" ${lazy ? 'loading="lazy"' : ''}>` : ph(s.t); }
function playBtn(s){ return s.au ? `<button class="play" type="button" data-play="${s.id}" aria-label="${esc(s.t)} を試聴">${ICON_PLAY}</button>` : ''; }
function charCard(c, i){
  const pic = c.img ? `<img src="${c.img}" alt="" loading="lazy">` : `<div class="ini" style="background:${c.c || '#555'}">${esc(c.n[0])}</div>`;
  return `<button type="button" class="ccard" data-char="${i}"><div class="pic">${pic}</div><div class="in"><b>${esc(c.n)}</b><small>${esc(c.w)}</small></div><i class="dot" style="background:${c.c || '#888'}"></i></button>`;
}
function songCard(s){
  return `<div class="scard"><div class="cover"><a href="#song-${s.id}" aria-label="${esc(s.t)}">${coverHTML(s)}</a>${playBtn(s)}</div><a href="#song-${s.id}" class="t">${esc(s.t)}</a><small class="num">${fmtD(s.d)}</small></div>`;
}
function phead(en, jp, p, crumb){
  return `<div class="wrap"><div class="phead">${crumb ? `<div class="crumb">${crumb}</div>` : ''}<span class="en">${en}</span><h1>${jp}</h1>${p ? `<p>${p}</p>` : ''}</div></div>`;
}
function tabs(list, on){ return `<div class="tabs">${list.map(([h, t]) => `<a href="#${h}" class="${h === on ? 'on' : ''}">${t}</a>`).join('')}</div>`; }

/* ---------- 共通パーツ ---------- */
$('#fcols').innerHTML = D.links.filter(l => !/旧サイト/.test(l.n)).map(l => `<a href="${l.u}" target="_blank" rel="noopener">${esc(l.n)} ↗</a>`).join('');
$('#fbuilt').textContent = `曲 ${D.stats.songs} ／ 画像 ${D.stats.images} ／ キャラクター ${D.stats.chars} ／ ストーリー ${D.stats.stories}　最終更新 ${D.built.replace(/-/g,'.')}　© OPSM（おぽ）`;

/* プレイヤー */
const audio = $('#audio');
const queue = D.songs.filter(s => s.au).slice().reverse();
let cur = null;
function setPP(){
  const playing = cur && !audio.paused;
  $('#ppp').innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  $$('[data-play]').forEach(b => { const on = playing && b.dataset.play === cur.id; b.classList.toggle('on', on); b.innerHTML = on ? ICON_PAUSE : ICON_PLAY; });
}
function play(id){
  const s = songById[id]; if (!s || !s.au) return;
  if (cur && cur.id === id){ audio.paused ? audio.play().catch(()=>{}) : audio.pause(); return; }
  cur = s; audio.src = s.au; audio.play().catch(()=>{});
  $('#player').classList.add('show');
  $('#pimg').src = s.cov || ''; $('#ptitle').textContent = s.t;
  $('#psub').textContent = `試聴30秒 ・ ${fmtD(s.d)}`;
  const su = $('#psuno'); if (s.suno){ su.href = s.suno; su.style.display = ''; } else su.style.display = 'none';
}
function step(n){ if (!cur) return play(queue[0].id); const i = queue.findIndex(s => s.id === cur.id); play(queue[(i + n + queue.length) % queue.length].id); }
audio.addEventListener('play', setPP); audio.addEventListener('pause', setPP);
audio.addEventListener('ended', () => step(1));
audio.addEventListener('timeupdate', () => { const p = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('#pprog i').style.width = p + '%'; });
$('#ppp').onclick = () => cur ? play(cur.id) : step(0);
$('#pnext').onclick = () => step(1); $('#pprev').onclick = () => step(-1);
$('#pclose').onclick = () => { audio.pause(); $('#player').classList.remove('show'); };
$('#pprog').onclick = e => { if (audio.duration) audio.currentTime = e.offsetX / e.currentTarget.clientWidth * audio.duration; };
document.addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b){ e.preventDefault(); play(b.dataset.play); } });

/* ライトボックス */
let lbList = [], lbI = 0;
function lbShow(i){ lbI = (i + lbList.length) % lbList.length; const g = lbList[lbI]; $('#lbi').src = g.f; $('#lbi').alt = g.l || ''; $('#lbc').textContent = `${g.l || g.g}　${lbI + 1} / ${lbList.length}`; $('#lb').classList.add('open'); }
$('#lbx').onclick = () => $('#lb').classList.remove('open');
$('#lbp').onclick = () => lbShow(lbI - 1); $('#lbn').onclick = () => lbShow(lbI + 1);
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') $('#lb').classList.remove('open'); });
function bindLB(list){ lbList = list; $$('[data-lb]').forEach(b => b.onclick = () => lbShow(+b.dataset.lb)); }

/* キャラクター */
function openChar(i){
  const c = D.chars[i];
  const pic = c.img ? `<img src="${c.img}" alt="${esc(c.n)}">` : `<div class="ini big" style="background:${c.c||'#555'}">${esc(c.n[0])}</div>`;
  const so = c.so.map(id => songById[id]).filter(Boolean).map(s => `<li><a href="#song-${s.id}" data-mclose>♪ ${esc(s.t)}</a></li>`).join('');
  $('#mbox').innerHTML = `<div class="pic">${pic}</div><div class="in"><button class="close" type="button" data-mclose>閉じる</button><span class="chip">${esc(c.w)}</span><h2>${esc(c.n)}</h2><p>${esc(c.d)}</p>${c.st ? `<p><a class="btn" href="#story-${c.st}" data-mclose>ストーリーを読む →</a></p>` : ''}${so ? `<ul class="mlist">${so}</ul>` : ''}</div>`;
  $('#modal').classList.add('open');
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-char]'); if (c){ openChar(+c.dataset.char); return; }
  if (e.target.closest('[data-mclose]') || e.target.id === 'modal') $('#modal').classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ $('#modal').classList.remove('open'); $('#lb').classList.remove('open'); $('#drawer').classList.remove('open'); }
  if ($('#lb').classList.contains('open')){ if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1); }
});
$('#hbtn').onclick = () => $('#drawer').classList.add('open');
$('#dclose').onclick = () => $('#drawer').classList.remove('open');
$$('#drawer a').forEach(a => a.addEventListener('click', () => $('#drawer').classList.remove('open')));

/* ---------- ページ ---------- */
const GAMES = [
  { t: '満員電車サバイバー', sub: '〜サラリーマン通勤あるある〜', d: '通勤あるあるをミニゲームに。満員電車を生きのびろ！ブラウザですぐ遊べます。', u: 'mansha/', img: 'img/mansha.webp', st: 'あそべる' },
  { t: '芽室まちもり大作戦！', sub: 'AIコミソンフェス in 芽室町', d: 'AIコミソンフェス in 芽室町のために作ったゲーム。', u: null, img: null, st: '公開準備中' },
  { t: 'SKY CITY', sub: 'Three.jsの未来都市', d: 'ブラウザの中に浮かぶ3Dの未来都市。ぐるっと見回して遊べます。', u: 'skycity/', img: null, st: 'あそべる' },
  { t: 'ChordTab', sub: '自作コード譜ツール', d: 'コード譜を書いて、見て、弾くための自作ツール。', u: 'https://opsmopsm.github.io/chordtab/', img: null, st: 'ツール' },
];
function fixH(h){ return h ? h.replace(/^#movie$/, '#video').replace(/^#art$/, '#image').replace(/^#index$/, '#about').replace(/^#history$/, '#about-history') : h; }
function secCount(k){
  return { music: `${D.songs.length}曲`, image: `${D.gallery.length}点`, video: `${D.vpub.length + D.vwip.length}本`, manga: '制作中', game: `${GAMES.length}本`, chara: `${D.chars.length}人`, story: `${D.stories.length}作`, about: `${D.stats.months}か月`, links: `${D.links.length}`, topics: `${D.activity.length}件` }[k];
}
function viewTop(){
  const latest = D.songs.filter(s => s.cov).slice(0, 12);
  return `<section class="blk"><div class="wrap">
    <div class="shead"><span class="en">10 Tables</span><h2>10のテーブル</h2><span class="muted small">ルーレットに任せても、ここから選んでもOK</span></div>
    <div class="tables">${SECTIONS.map((s, i) => `<a class="tbl ${i % 2 ? 'blk2' : 'red'}" href="#${s.k}"><span class="no num">${String(i + 1).padStart(2, '0')}</span><b>${s.t}</b><small>${s.d}</small><span class="cnt num">${secCount(s.k)}</span></a>`).join('')}</div>
  </div></section>
  <section class="blk"><div class="wrap two">
    <div><div class="shead"><span class="en">Topics</span><h2>トピック</h2><a class="more" href="#topics">すべて →</a></div>
      <ul class="news">${D.activity.slice(0, 6).map(newsLI).join('')}</ul>
    </div>
    <div><div class="shead"><span class="en">Pick Up</span><h2>いまのおすすめ</h2></div>
      <div class="picks">${D.ads.slice(0, 4).map(a => { const h = fixH(a.href); return `<a class="pick" href="${h}"${tgt(h)}>${a.img ? `<img src="${a.img}" alt="" loading="lazy">` : ''}<div><span class="k">${esc(a.k)}</span><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div></a>`; }).join('')}</div>
    </div>
  </div></section>
  <section class="blk"><div class="wrap">
    <div class="shead"><span class="en">New Songs</span><h2>あたらしい曲</h2><a class="more" href="#music">全曲リスト →</a></div>
    <div class="hscroll">${latest.map(songCard).join('')}</div>
  </div></section>`;
}
function newsLI(a){ const h = fixH(a.href); return `<li><span class="num">${fmtD(a.d)}</span><span class="cat">${esc(a.c)}</span>${h ? `<a href="${h}"${tgt(h)}>${esc(a.t)}</a>` : `<b>${esc(a.t)}</b>`}</li>`; }

/* ルーレットのUI */
function showResult(i){
  const s = SECTIONS[i];
  $('#rno').textContent = String(i + 1).padStart(2, '0');
  $('#rt').textContent = s.t; $('#rd').textContent = s.d;
  $('#rgo').href = '#' + s.k;
  $('#result').classList.add('show');
}
function initTop(){}
(function stageUI(){
  $('#quick').innerHTML = SECTIONS.map((s, i) => `<a href="#${s.k}" data-qi="${i}">${s.t}</a>`).join('');
  const btn = $('#spin');
  const doSpin = () => {
    if (!window.OPSMWheel){ showResult(Math.floor(Math.random() * SECTIONS.length)); return; }
    $('#result').classList.remove('show'); btn.disabled = true; btn.textContent = 'SPINNING…';
    OPSMWheel.spin().then(i => { btn.disabled = false; btn.textContent = 'もう一回 SPIN'; if (i >= 0) showResult(i); });
  };
  btn.onclick = doSpin; $('#ragain').onclick = doSpin;
  $('#rx').onclick = () => $('#result').classList.remove('show');
  $('#rgo').addEventListener('click', () => $('#result').classList.remove('show'));
  window.addEventListener('wheel-pick', e => { location.hash = '#' + SECTIONS[e.detail].k; });
  window.addEventListener('wheel-hover', e => { $$('#quick a').forEach((a, i) => a.classList.toggle('hv', i === e.detail)); });
  window.addEventListener('wheel-ready', () => { document.body.classList.add('gl'); if (!document.body.classList.contains('is-top')) OPSMWheel.pause(); });
})();
/* AI音楽 */
let mq = '', mf = 'すべて';
function viewMusic(){
  const sers = D.stories.filter(st => D.songs.some(s => s.ser === st.k));
  const chips = ['すべて', '試聴あり', '歌詞あり', ...sers.map(s => s.t), '2026', '2025'];
  return phead('AI Music', 'AI音楽', `Sunoで作った全${D.songs.length}曲。▶で30秒の試聴、曲名で詳しいページへ。`) +
  `<div class="wrap">${tabs([['music', '全曲リスト'], ['music-persona', 'ペルソナ']], 'music')}
  <div class="tools"><input id="mq" type="search" placeholder="曲名・タグ・メモで検索" value="${esc(mq)}" aria-label="曲を検索"><button class="btn small" id="playall" type="button">▶ 表示中を続けて試聴</button></div>
  <div class="chips">${chips.map(c => `<button type="button" class="chip-b${mf === c ? ' on' : ''}" data-mf="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <p class="count" id="mcount"></p>
  <ol class="slist" id="slist"></ol></div>`;
}
function musicList(){
  const q = mq.trim().toLowerCase();
  return D.songs.filter(s => {
    if (mf === '試聴あり' && !s.au) return false;
    if (mf === '歌詞あり' && !s.ly) return false;
    if (/^20\d\d$/.test(mf) && !s.d.startsWith(mf)) return false;
    const st = storyByK[s.ser];
    if (!['すべて','試聴あり','歌詞あり'].includes(mf) && !/^20\d\d$/.test(mf) && !(st && st.t === mf)) return false;
    return !q || (s.t + ' ' + s.y + ' ' + s.tags.join(' ') + ' ' + s.ev.join(' ') + ' ' + (s.note || '')).toLowerCase().includes(q);
  });
}
function renderMusic(){
  const L = musicList();
  $('#mcount').textContent = `${L.length}曲`;
  $('#slist').innerHTML = L.map(s => `<li><div class="th">${coverHTML(s)}${playBtn(s)}</div><div class="ti"><a href="#song-${s.id}">${esc(s.t)}</a><small>${s.tags.filter(t => t !== 'シリーズ').slice(0, 3).map(esc).join('・')}${s.ev.length ? '　#' + esc(s.ev[0]) : ''}</small></div><span class="d num">${fmtD(s.d)}</span><span class="fl">${s.ly ? '<i title="歌詞あり">詞</i>' : ''}${s.suno ? `<a href="${s.suno}" target="_blank" rel="noopener" title="Sunoで聴く">Suno↗</a>` : ''}</span></li>`).join('') || '<li class="empty">見つかりませんでした</li>';
  setPP();
}
function initMusic(){
  renderMusic();
  $('#mq').oninput = e => { mq = e.target.value; renderMusic(); };
  $$('[data-mf]').forEach(b => b.onclick = () => { mf = b.dataset.mf; $$('[data-mf]').forEach(x => x.classList.toggle('on', x === b)); renderMusic(); });
  $('#playall').onclick = () => { const L = musicList().filter(s => s.au); if (L.length){ queue.length = 0; L.forEach(s => queue.push(s)); cur = null; play(L[0].id); } };
}
function viewPersona(){
  const icons = D.gallery.filter(g => g.g === 'ペルソナ・アイコン');
  const sp = D.chars.find(c => c.n === 'スペ恋ちゃん'), pc = D.chars.find(c => /ペルソナ/.test(c.n));
  const spi = D.chars.indexOf(sp);
  return phead('AI Music', 'AI音楽', 'OPSMの歌声たち。Sunoのペルソナ（現Voice）として育ててきた声とキャラクター。') +
  `<div class="wrap">${tabs([['music', '全曲リスト'], ['music-persona', 'ペルソナ']], 'music-persona')}
  <div class="persona-main">
    <button type="button" class="pm" data-char="${spi}"><img src="${sp.img}" alt=""><div><span class="k">MAIN PERSONA</span><b>${esc(sp.n)}</b><p>${esc(sp.d)}</p></div></button>
    <div class="pm txt"><span class="k">ABOUT</span><b>${esc(pc.n)}</b><p>${esc(pc.d)}</p><p>Supekoiはスペ恋ちゃんの声、Distortionは「テキーラディストーション」のディス姉から生まれた声です。</p></div>
  </div>
  <div class="shead"><span class="en">Persona Icons</span><h2>ペルソナ・アイコン</h2></div>
  <div class="pgrid">${icons.map((g, i) => `<button type="button" data-lb="${i}" aria-label="拡大"><img src="${g.f}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
}
function viewSong(id){
  const s = songById[id]; if (!s) return viewNotFound();
  const i = D.songs.indexOf(s), newer = D.songs[i - 1], older = D.songs[i + 1];
  const st = s.ser && storyByK[s.ser];
  const chars = D.chars.map((c, ci) => [c, ci]).filter(([c]) => c.so.includes(s.id));
  const vids = D.vpub.filter(v => v.so === s.id);
  return `<div class="wrap"><div class="sd">
    <div class="cover">${coverHTML(s, false)}</div>
    <div>
      <div class="crumb"><a href="#music">AI音楽</a> ／ ${fmtD(s.d).slice(0, 4)}年</div>
      <div>${s.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <h1>${esc(s.t)}</h1>
      <div class="meta"><span>公開 <b class="num">${fmtD(s.d)}</b></span>${s.ev.length ? `<span>イベント <b>${s.ev.map(e => '#' + esc(e)).join(' ')}</b></span>` : ''}${s.dur ? `<span>尺 <b class="num">${Math.floor(s.dur / 60)}:${String(s.dur % 60).padStart(2, '0')}</b></span>` : ''}</div>
      ${s.au ? `<p class="pline">${playBtn(s)}<span>30秒試聴</span></p>` : '<p class="muted">この曲の試聴音源はまだありません。</p>'}
      <p class="btns">${s.suno ? `<a class="btn lamp" href="${s.suno}" target="_blank" rel="noopener">Sunoでフル再生 ↗</a>` : ''}${st ? `<a class="btn" href="#story-${st.k}">ストーリー「${esc(st.t)}」→</a>` : ''}${vids.map(v => `<a class="btn" href="${v.url}" target="_blank" rel="noopener">YouTubeで${esc(v.kind)} ↗</a>`).join('')}</p>
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
      ${chars.length ? `<div class="cgrid sm">${chars.map(([c, ci]) => charCard(c, ci)).join('')}</div>` : ''}
      ${s.ly ? `<details class="ly" open><summary>歌詞</summary><div class="lyrics">${esc(s.ly)}</div></details>` : ''}
    </div></div>
    <div class="pn">${newer ? `<a href="#song-${newer.id}"><small>← 次に新しい曲</small>${esc(newer.t)}</a>` : '<span></span>'}${older ? `<a href="#song-${older.id}" class="r"><small>ひとつ前の曲 →</small>${esc(older.t)}</a>` : ''}</div>
  </div>`;
}

/* AI画像 */
let artF = 'すべて';
function viewImage(){
  const groups = ['すべて', ...Array.from(new Set(D.gallery.map(g => g.g)))];
  return phead('AI Image', 'AI画像', `ちちぷい・あいぴくへの投稿作品、ジャケット、キャラクター設定画など${D.gallery.length}点。タップで拡大。`) +
  `<div class="wrap"><div class="chips">${groups.map(g => `<button type="button" class="chip-b${artF === g ? ' on' : ''}" data-g="${esc(g)}">${esc(g)} <span class="num">${g === 'すべて' ? D.gallery.length : D.gallery.filter(x => x.g === g).length}</span></button>`).join('')}</div>
  <div class="masonry" id="mas"></div>
  <p class="btns center"><a class="btn" href="https://www.chichi-pui.com/" target="_blank" rel="noopener">ちちぷい ↗</a><a class="btn" href="https://www.aipictors.com/users/7218661c-88a6-f43e-5a90-08c52fb4da4d" target="_blank" rel="noopener">あいぴく ↗</a></p></div>`;
}
function renderArt(){
  const L = D.gallery.filter(g => artF === 'すべて' || g.g === artF);
  $('#mas').innerHTML = L.map((g, i) => `<button type="button" data-lb="${i}" aria-label="${esc(g.l || g.g)}を拡大"><img src="${g.f}" width="${g.w}" height="${g.h}" alt="" loading="lazy"><span>${esc(g.l || g.g)}</span></button>`).join('');
  bindLB(L);
}
function initImage(){ renderArt(); $$('[data-g]').forEach(b => b.onclick = () => { artF = b.dataset.g; $$('[data-g]').forEach(x => x.classList.toggle('on', x === b)); renderArt(); }); }

/* AI動画 */
function viewVideo(){
  return phead('AI Video', 'AI動画', `公開中のMVとショート、そして制作中の映像。手元の動画クリップは${D.stats.clips}本以上。`) +
  `<div class="wrap"><div class="shead"><span class="en">On YouTube</span><h2>公開中</h2><a class="more" href="https://www.youtube.com/@OPSM_opsm" target="_blank" rel="noopener">チャンネルへ ↗</a></div>
  <div class="mv">${D.vpub.map(v => `<a class="mvc" href="${v.url}" target="_blank" rel="noopener"><div class="th"><img src="${v.img}" alt="" loading="lazy"><span class="yt">▶</span><span class="k">${esc(v.kind)}</span></div><b>${esc(v.t)}</b><p>${esc(v.d)}</p></a>`).join('')}</div>
  <div class="shead"><span class="en">In Production</span><h2>制作中</h2></div>
  <div class="mv">${D.vwip.map(v => `<div class="mvc"><div class="th">${v.video ? `<video src="${v.video}" poster="${v.img || ''}" controls preload="none" playsinline></video>` : v.img ? `<img src="${v.img}" alt="" loading="lazy">` : '<div class="ph"><span>COMING SOON</span></div>'}<span class="k wip">${esc(v.st)}</span></div><b>${esc(v.t)}</b><p>${esc(v.d)}</p></div>`).join('')}</div></div>`;
}

/* AIゲーム */
function viewGame(){
  return phead('AI Game', 'AIゲーム', 'AIといっしょに作った、ブラウザで遊べるゲームとツール。') +
  `<div class="wrap"><div class="games">${GAMES.map(g => { const tag = g.u ? 'a' : 'div'; return `<${tag} class="game"${g.u ? ` href="${g.u}"${tgt(g.u)}` : ''}><div class="th">${g.img ? `<img src="${g.img}" alt="" loading="lazy">` : ph(g.t)}<span class="k${g.u ? '' : ' wip'}">${esc(g.st)}</span></div><div class="in"><b>${esc(g.t)}</b><small>${esc(g.sub)}</small><p>${esc(g.d)}</p>${g.u ? `<span class="btn lamp small">${g.st === 'ツール' ? 'ひらく' : 'あそぶ'} →</span>` : ''}</div></${tag}>`; }).join('')}</div></div>`;
}

/* シリーズ */
function viewSeries(){
  return phead('Story', 'ストーリー', '曲から生まれた物語、キャラクターから広がる世界。') +
  `<div class="wrap"><div class="series">${D.stories.map(s => `<a class="ser" href="#story-${s.k}"><img src="${s.hero}" alt="" loading="lazy"><div class="in"><span class="en">${esc(s.en)}</span><h3>${esc(s.t)}</h3><p>${esc(s.lead)}</p><small>${esc(s.genre)}　${esc(s.since)}</small></div></a>`).join('')}</div>
  <div class="shead"><span class="en">Project Files</span><h2>企画メモ</h2></div>
  <div class="projs">${D.proj.map(p => `<div><span class="chip">${esc(p.k)}</span><b>${esc(p.t)}</b><p>${esc(p.d)}</p></div>`).join('')}</div></div>`;
}
function viewStory(k){
  const s = storyByK[k]; if (!s) return viewNotFound();
  const chars = D.chars.map((c, i) => [c, i]).filter(([c]) => c.st === k);
  const sl = s.so.map(id => songById[id]).filter(Boolean);
  const idx = D.stories.indexOf(s), nx = D.stories[(idx + 1) % D.stories.length];
  return `<section class="shero"><img src="${s.hero}" alt=""><div class="wrap in"><div class="crumb"><a href="#story">ストーリー</a> ／ ${esc(s.genre)}</div><span class="en">${esc(s.en)}</span><h1>${esc(s.t)}</h1><p>${esc(s.lead)}</p></div></section>
  <section class="blk"><div class="wrap sbody">
    <div>
      <div class="prose">${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${s.video ? `<figure class="vbox"><video src="${s.video}" poster="${s.img2 || s.hero}" controls preload="none" playsinline></video><figcaption>${esc(s.video_cap || '')}</figcaption></figure>` : (s.img2 ? `<figure class="vbox"><img src="${s.img2}" alt="" loading="lazy"></figure>` : '')}
      ${s.album ? `<h2 class="h2s">アルバム収録曲</h2><ol class="album">${s.album.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      ${chars.length ? `<h2 class="h2s">登場キャラクター</h2><div class="cgrid">${chars.map(([c, i]) => charCard(c, i)).join('')}</div>` : ''}
      ${sl.length ? `<h2 class="h2s">関連曲</h2><div class="sgrid">${sl.map(songCard).join('')}</div>` : ''}
    </div>
    <aside class="side">
      <h3>世界のメモ</h3>
      <dl class="facts">${(s.world || []).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
      ${s.making && s.making.length ? `<h3>制作メモ</h3><ul class="mlist">${s.making.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      ${s.yt ? `<p><a class="btn lamp" href="${s.yt}" target="_blank" rel="noopener">YouTubeで見る ↗</a></p>` : ''}
      <p><a class="btn" href="#story-${nx.k}">次のストーリー：${esc(nx.t)} →</a></p>
    </aside>
  </div></section>`;
}

/* キャラクター */
let chF = 'すべて';
function viewChara(){
  const works = ['すべて', ...Array.from(new Set(D.chars.map(c => c.w)))];
  return phead('Character', 'キャラクター', `曲やシリーズに登場する${D.chars.length}人のなかまたち。カードを押すとプロフィール。`) +
  `<div class="wrap"><div class="chips">${works.map(w => `<button type="button" class="chip-b${chF === w ? ' on' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="cgrid" id="cg"></div></div>`;
}
function initChara(){
  const r = () => $('#cg').innerHTML = D.chars.map((c, i) => [c, i]).filter(([c]) => chF === 'すべて' || c.w === chF).map(([c, i]) => charCard(c, i)).join('');
  r(); $$('[data-w]').forEach(b => b.onclick = () => { chF = b.dataset.w; $$('[data-w]').forEach(x => x.classList.toggle('on', x === b)); r(); });
}

/* OPSM */
function viewOpsm(){
  const tools = ['Suno','Suno Studio','Mureka','ちちぷい','あいぴく（Aipictors）','SeaArt','ChatGPT画像','Midjourney','Higgsfield','Kling','Seedance','Grok','fal.ai','Blender','Mixamo','DaVinci Resolve','Filmora','JIZURA','ElevenLabs','Style-Bert-VITS2','Cubase','Cakewalk','Ableton Note','Focusrite Scarlett 2i2','LPD8','Notion','note','Claude','Claude Code'];
  const st = D.stats;
  return phead('About OPSM', 'OPSMとは', 'AIで遊ぶEnjoy勢、おぽのこと。') +
  `<div class="wrap">${tabs([['about', '自己紹介'], ['about-history', '沿革']], 'about')}
  <div class="about"><div class="pic"><img src="${D.chars[0].img}" alt="モモンガのアイコン"></div><div class="prose">
    <h2>OPSM（おぽ）です</h2>
    <p>名前の由来は「オポッサム」です。かわいい動物の名前にしたかったのですが、有名な動物の名前はすでに使われていることが多く、個性を出すのが難しいと思いました。そこで、あまり被らなさそうで少しユニークな動物として、オポッサムを選びました。</p>
    <p>ただ、そのままだと少し長いので、DAIGOさんのような略し方のノリでOPSMに。そして、もっと気軽に呼んでもらえるように「おぽ」という呼び名もつけています。アイコンは、初MVをきっかけにモモンガになりました。</p>
    <h2>創作スタンス</h2>
    <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやっています。「やってみたい！」が軸のEnjoy勢です。自分が聴きたい曲をAIに作ってもらっていますが、思い通りにするのは本当に難しい。みなさんのセンスと創作力には圧倒されつつ、元気ももらっています。</p>
    <p>純粋に楽しいからやる「一次的欲求」を大切に。需要は頭の片隅に置きつつ、誰かのなぞりにはしない。作品を出すことが、クリエイターとしての存在証明だと思っています。</p>
  </div></div>
  <div class="stats">${[['曲', st.songs], ['画像', st.images], ['キャラクター', st.chars], ['ストーリー', st.stories], ['活動', st.months + 'か月']].map(([a, b]) => `<div><b class="num">${b}</b><small>${a}</small></div>`).join('')}</div>
  <div class="shead"><span class="en">Toolbox</span><h2>使っている道具</h2></div>
  <div class="tags">${tools.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`;
}
function viewHistory(){
  return phead('About OPSM', 'OPSMとは', '2025年6月にSunoと出会ってから、今日まで。') +
  `<div class="wrap">${tabs([['about', '自己紹介'], ['about-history', '沿革']], 'about-history')}
  <ol class="tl">${D.history.slice().reverse().map(h => { const [y, m] = h.m.split('-'); const s = h.so && songById[h.so]; return `<li><div class="ym num">${+m}月<small>${y}</small></div><div class="c"><h3>${esc(h.h)}</h3><p>${esc(h.d)}</p>${s ? `<a href="#song-${s.id}">♪ ${esc(s.t)} →</a>` : ''}</div></li>`; }).join('')}</ol></div>`;
}


/* AI漫画 */
function viewManga(){
  const P = D.proj.filter(p => /漫画|ホラー/.test(p.k));
  const A = D.activity.filter(a => /漫画|ホラー/.test(a.t + a.x));
  return phead('AI Manga', 'AI漫画', 'AIで描く漫画の部屋。いまは第1作を制作中です。') +
  `<div class="wrap"><div class="manga">${P.map((p, i) => `<div class="mg"><div class="cover"><span class="en">${i === 0 ? 'Now Making' : 'Idea'}</span><b>${esc(p.t)}</b><i>${esc(p.k)}</i></div><div class="in"><span class="k wip">${i === 0 ? '制作中' : '構想中'}</span><p>${esc(p.d)}</p></div></div>`).join('')}</div>
  ${A.length ? `<div class="shead"><span class="en">Log</span><h2>制作メモ</h2></div><ul class="news">${A.map(a => `<li><span class="num">${fmtD(a.d)}</span><span class="cat">${esc(a.c)}</span><b>${esc(a.t)}</b><span class="x">${esc(a.x)}</span></li>`).join('')}</ul>` : ''}
  <p class="muted" style="margin-top:28px">完成したページから順番にここで公開していきます。</p></div>`;
}

/* トピック */
function viewTopics(){
  return phead('Topics', 'トピック', 'OPSMの最近のできごと。新曲、新作、制作の進み具合など。') +
  `<div class="wrap"><ul class="news big">${D.activity.map(a => { const h = fixH(a.href); return `<li>${a.img ? `<img src="${a.img}" alt="" loading="lazy">` : ''}<span class="num">${fmtD(a.d)}</span><span class="cat">${esc(a.c)}</span>${h ? `<a href="${h}"${tgt(h)}>${esc(a.t)}</a>` : `<b>${esc(a.t)}</b>`}<span class="x">${esc(a.x)}</span></li>`; }).join('')}</ul>
  <p class="btns"><a class="btn" href="#about-history">これまでの沿革 →</a></p></div>`;
}

/* リンク */
function viewLinks(){
  const L = D.links.map(l => /旧サイト/.test(l.n) ? Object.assign({}, l, { u: 'old.html' }) : l);
  L.splice(L.length - 1, 0, { n: 'OPSM大辞典', h: 'daijiten', u: 'daijiten/', d: '全データを一冊にまとめた辞典版' });
  return phead('Links', 'リンク', 'OPSMの居場所いろいろ。') +
  `<div class="wrap"><div class="links">${L.map(l => `<a href="${l.u}"${tgt(l.u)}><b>${esc(l.n)}</b><small>${esc(l.h)}</small><span>${esc(l.d)}${isExt(l.u) ? ' ↗' : ' →'}</span></a>`).join('')}</div></div>`;
}
function viewNotFound(){ return phead('404', '迷子になりました', 'このページは森の奥に消えたようです。') + '<div class="wrap"><a class="btn lamp" href="#top">基地へもどる</a></div>'; }

/* ---------- ルーター ---------- */
function route(){
  const h = (location.hash || '#top').slice(1);
  let html, init = null, nav = h.split('-')[0];
  const top = h === 'top' || h === '';
  if (top) { html = viewTop(); init = initTop; nav = ''; }
  else if (h === 'music') { html = viewMusic(); init = initMusic; }
  else if (h === 'music-persona') { html = viewPersona(); init = () => bindLB(D.gallery.filter(g => g.g === 'ペルソナ・アイコン')); }
  else if (h.startsWith('song-')) { html = viewSong(h.slice(5)); nav = 'music'; }
  else if (h === 'image') { html = viewImage(); init = initImage; }
  else if (h === 'video') html = viewVideo();
  else if (h === 'manga') html = viewManga();
  else if (h === 'game') html = viewGame();
  else if (h === 'chara') { html = viewChara(); init = initChara; }
  else if (h === 'story') html = viewSeries();
  else if (h.startsWith('story-')) html = viewStory(h.slice(6));
  else if (h === 'about') html = viewOpsm();
  else if (h === 'about-history') html = viewHistory();
  else if (h === 'links') html = viewLinks();
  else if (h === 'topics') html = viewTopics();
  else html = viewNotFound();
  document.body.classList.toggle('is-top', top);
  if (window.OPSMWheel) top ? OPSMWheel.resume() : OPSMWheel.pause();
  app.innerHTML = html;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + nav));
  if (init) init();
  setPP();
  window.scrollTo(0, 0);
  const t = $('h1', app); document.title = (nav === '' || !t ? SITE : t.textContent.trim() + '｜' + SITE);
}
window.addEventListener('hashchange', route);
route();
setPP();
})();
