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
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ---------- モモンガ（SVG） ---------- */
function mmSVG(){
  return `<svg viewBox="0 0 200 232" class="mmsvg" aria-hidden="true">
  <g class="front">
    <path class="tail" d="M128 176 C182 182 204 122 176 82 C166 68 152 76 160 96 C172 126 154 152 122 154 Z" fill="#a8794c"/>
    <path d="M160 96 C168 112 166 132 152 146" stroke="#8a5f38" stroke-width="5" fill="none" stroke-linecap="round" class="tail"/>
    <path d="M58 122 Q26 164 50 200 L150 200 Q174 164 142 122 Z" fill="#9b6c42"/>
    <ellipse cx="100" cy="160" rx="40" ry="44" fill="#ba8a5b"/>
    <ellipse cx="100" cy="168" rx="27" ry="32" fill="#f7eddc"/>
    <ellipse class="legL" cx="80" cy="206" rx="14" ry="8" fill="#e9c9a6"/>
    <ellipse class="legR" cx="120" cy="206" rx="14" ry="8" fill="#e9c9a6"/>
    <g><ellipse cx="62" cy="152" rx="10" ry="19" fill="#ba8a5b" transform="rotate(18 62 152)"/><circle cx="57" cy="168" r="8" fill="#e9c9a6"/></g>
    <g class="arm"><ellipse cx="146" cy="118" rx="10" ry="22" fill="#ba8a5b" transform="rotate(28 146 118)"/><g class="paw"><circle cx="156" cy="98" r="9.5" fill="#e9c9a6"/><path d="M150 92 l-3 -5 M156 89 l0 -6 M162 92 l3 -5" stroke="#c9a17b" stroke-width="2.4" stroke-linecap="round"/></g></g>
    <path d="M66 120 Q100 136 134 120 L132 130 Q100 146 68 130 Z" fill="#3aa6d6"/>
    <path d="M118 128 l14 16 l-18 -2 Z" fill="#2f8fbb"/>
    <ellipse cx="60" cy="44" rx="17" ry="21" fill="#ba8a5b"/><ellipse cx="60" cy="47" rx="9" ry="12" fill="#f0bfa8"/>
    <ellipse cx="140" cy="44" rx="17" ry="21" fill="#ba8a5b"/><ellipse cx="140" cy="47" rx="9" ry="12" fill="#f0bfa8"/>
    <ellipse cx="100" cy="80" rx="58" ry="50" fill="#c99a6a"/>
    <ellipse cx="100" cy="98" rx="42" ry="30" fill="#f4e5cf"/>
    <path d="M100 32 Q96 52 100 70" stroke="#8a5f38" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
    <g class="eyes">
      <ellipse cx="74" cy="78" rx="18" ry="20" fill="#3b2614"/><ellipse cx="126" cy="78" rx="18" ry="20" fill="#3b2614"/>
      <ellipse cx="74" cy="79" rx="14" ry="16" fill="#0d0a08"/><ellipse cx="126" cy="79" rx="14" ry="16" fill="#0d0a08"/>
      <circle cx="79" cy="72" r="5.5" fill="#fff"/><circle cx="131" cy="72" r="5.5" fill="#fff"/>
      <circle cx="70" cy="86" r="2.4" fill="#fff" opacity=".8"/><circle cx="122" cy="86" r="2.4" fill="#fff" opacity=".8"/>
    </g>
    <ellipse cx="100" cy="99" rx="6" ry="4.2" fill="#e5848f"/>
    <path d="M92 106 Q100 114 108 106" stroke="#5a3a22" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="62" cy="102" r="8" fill="#f29aa8" opacity=".45"/><circle cx="138" cy="102" r="8" fill="#f29aa8" opacity=".45"/>
    <path d="M84 100 L54 94 M84 104 L54 106 M116 100 L146 94 M116 104 L146 106" stroke="#7a5a42" stroke-width="1.4" opacity=".6"/>
  </g>
  <g class="back">
    <path d="M52 124 Q20 166 46 204 L154 204 Q180 166 148 124 Z" fill="#956840"/>
    <ellipse cx="100" cy="160" rx="42" ry="46" fill="#a87a4e"/>
    <ellipse class="legL" cx="80" cy="208" rx="13" ry="8" fill="#d9b48f"/>
    <ellipse class="legR" cx="120" cy="208" rx="13" ry="8" fill="#d9b48f"/>
    <ellipse cx="60" cy="44" rx="17" ry="21" fill="#ad7f52"/><ellipse cx="140" cy="44" rx="17" ry="21" fill="#ad7f52"/>
    <ellipse cx="100" cy="82" rx="58" ry="50" fill="#b88a5c"/>
    <path d="M66 122 Q100 138 134 122 L132 132 Q100 148 68 132 Z" fill="#3aa6d6"/>
    <path d="M94 128 l6 22 l6 -22 Z" fill="#2f8fbb"/>
    <path class="tail" d="M100 222 C66 210 64 150 100 128 C136 150 134 210 100 222 Z" fill="#c49464"/>
    <path class="tail" d="M100 214 L100 140" stroke="#9c6f45" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;
}

/* ---------- 葉っぱ ---------- */
const LEAF_COLORS = [['#2f6b2c','#245322'],['#3e8a35','#2c6826'],['#56a447','#3d7f32'],['#6fbf55','#4f9a3c'],['#24552a','#1b411f'],['#7fcf62','#5aa846']];
const leafURL = ([f, v]) => "url('data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M2 30 C20 2 70 -4 98 30 C70 64 20 58 2 30 Z" fill="${f}"/><path d="M4 30 L92 30 M30 30 L48 14 M30 30 L48 46 M58 30 L74 18 M58 30 L74 42" stroke="${v}" stroke-width="3" fill="none"/></svg>`) + "')";
const LEAVES = LEAF_COLORS.map(leafURL);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

function buildIntro(){
  $('#mm').innerHTML = mmSVG();
  // 葉っぱの壁
  const wall = $('#wall'); let h = '';
  const HX = 50, HY = 62;
  for (let i = 0; i < 520; i++){
    const x = rnd(-4, 104), y = Math.pow(Math.random(), 0.8) * 108 - 6;
    const dx = (x - HX) / 9, dy = (y - HY) / 17, d = dx * dx + dy * dy;
    if (d < 1) continue;
    const near = d < 2.6 ? ' nh' : '';
    const w = rnd(4.5, 10);
    h += `<i class="lf${near}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${w.toFixed(1)}vmin;background-image:${pick(LEAVES)};transform:rotate(${rnd(-180,180).toFixed(0)}deg);--d:${rnd(0,.3).toFixed(2)}s"></i>`;
  }
  wall.insertAdjacentHTML('beforeend', h);
  // 遠景の木
  let f = '';
  for (let i = 0; i < 9; i++) f += `<span style="left:${i * 12.5 - 4 + rnd(-3,3)}%;width:${rnd(5,9)}vmin;height:${rnd(60,90)}%;opacity:${rnd(.35,.7).toFixed(2)}"></span>`;
  $('#far').innerHTML = f;
  // ガサッで飛び出す葉
  let b = '';
  for (let i = 0; i < 22; i++){ const a = rnd(-Math.PI, 0.2), r = rnd(14, 38); b += `<i style="background-image:${pick(LEAVES)};--dx:${(Math.cos(a) * r).toFixed(1)}vmin;--dy:${(Math.sin(a) * r).toFixed(1)}vmin;--r:${rnd(-540,540).toFixed(0)}deg;--d:${rnd(0,.15).toFixed(2)}s;width:${rnd(3,6).toFixed(1)}vmin"></i>`; }
  $('#burst').innerHTML = b;
  // 突入時に手前を流れる大きな葉
  let r = '';
  for (let i = 0; i < 26; i++){ const a = (i / 26) * Math.PI * 2 + rnd(-.2,.2), dist = rnd(70, 110); r += `<i style="background-image:${pick(LEAVES)};--dx:${(Math.cos(a) * dist).toFixed(0)}vmax;--dy:${(Math.sin(a) * dist).toFixed(0)}vmax;--r:${(a * 57 + 90).toFixed(0)}deg;--d:${rnd(0,.45).toFixed(2)}s;width:${rnd(18,34).toFixed(0)}vmin"></i>`; }
  $('#rush').innerHTML = r;
}

let introTimers = [];
function runIntro(){
  const root = document.documentElement, intro = $('#intro');
  root.classList.add('intro-on');
  intro.className = ''; intro.style.display = '';
  buildIntro();
  const steps = [
    [80, 'st-in'],        // 森の入口、モモンガ登場
    [700, 'st-beckon'],   // 手招き「こっちこっち！」
    [2700, 'st-turn'],    // くるっと振り向いて
    [2900, 'st-run'],     // 奥の葉っぱの壁へ走る
    [4000, 'st-gasa'],    // ガサッ
    [4700, 'st-push'],    // 葉っぱの中をぬける
    [5800, 'st-out'],     // 秘密基地に到着
  ];
  introTimers.forEach(clearTimeout); introTimers = [];
  steps.forEach(([t, c]) => introTimers.push(setTimeout(() => intro.classList.add(c), t)));
  introTimers.push(setTimeout(endIntro, 6600));
  window.scrollTo(0, 0);
}
function endIntro(){
  introTimers.forEach(clearTimeout); introTimers = [];
  const intro = $('#intro');
  try { sessionStorage.setItem('opsm-intro', '1'); } catch(e){}
  if (!intro.classList.contains('st-out')) intro.classList.add('st-out');
  setTimeout(() => { intro.style.display = 'none'; intro.className = ''; ['#wall .lf','#far span'].forEach(s => $$(s).forEach(e => e.remove())); }, 650);
  document.documentElement.classList.remove('intro-on');
  const hero = $('.hero'); if (hero){ hero.classList.remove('arrive'); void hero.offsetWidth; hero.classList.add('arrive'); }
}
$('#skip').onclick = endIntro;
$('#replay').onclick = () => { if (location.hash && location.hash !== '#top') location.hash = '#top'; setTimeout(runIntro, 50); };

/* ---------- 共通パーツ ---------- */
$('#fcols').innerHTML = D.links.filter(l => !/旧サイト/.test(l.n)).map(l => `<a href="${l.u}" target="_blank" rel="noopener">${esc(l.n)} ↗</a>`).join('');
$('#fbuilt').textContent = `曲 ${D.stats.songs} ／ 画像 ${D.stats.images} ／ キャラクター ${D.stats.chars} ／ シリーズ ${D.stats.stories}　最終更新 ${D.built.replace(/-/g,'.')}　© OPSM（おぽ）`;
$('#fmm').innerHTML = mmSVG();

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
  $('#mbox').innerHTML = `<div class="pic">${pic}</div><div class="in"><button class="close" type="button" data-mclose>閉じる</button><span class="chip">${esc(c.w)}</span><h2>${esc(c.n)}</h2><p>${esc(c.d)}</p>${c.st ? `<p><a class="btn" href="#series-${c.st}" data-mclose>シリーズを見る →</a></p>` : ''}${so ? `<ul class="mlist">${so}</ul>` : ''}</div>`;
  $('#modal').classList.add('open');
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-char]'); if (c){ openChar(+c.dataset.char); return; }
  if (e.target.closest('[data-mclose]') || e.target.id === 'modal') $('#modal').classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ $('#modal').classList.remove('open'); $('#lb').classList.remove('open'); $('#drawer').classList.remove('open'); if (document.documentElement.classList.contains('intro-on')) endIntro(); }
  if ($('#lb').classList.contains('open')){ if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1); }
});
$('#hbtn').onclick = () => $('#drawer').classList.add('open');
$('#dclose').onclick = () => $('#drawer').classList.remove('open');
$$('#drawer a').forEach(a => a.addEventListener('click', () => $('#drawer').classList.remove('open')));

/* ---------- ページ ---------- */
const GAMES = [
  { t: '満員電車サバイバー', sub: '〜サラリーマン通勤あるある〜', d: '通勤あるあるをミニゲームに。満員電車を生きのびろ！ブラウザですぐ遊べます。', u: 'mansha/', img: 'img/mansha.webp', st: 'あそべる' },
  { t: '芽室まちもり大作戦！', sub: 'AIコミソンフェス in 芽室町', d: 'AIコミソンフェス in 芽室町のために作ったゲーム。', u: null, img: null, st: '公開準備中' },
  { t: 'ChordTab', sub: '自作コード譜ツール', d: 'コード譜を書いて、見て、弾くための自作ツール。', u: 'https://opsmopsm.github.io/chordtab/', img: null, st: 'ツール' },
];
function rooms(){
  const latest = D.songs.find(s => s.cov);
  const persona = D.gallery.find(g => g.g === 'ペルソナ・アイコン');
  const img = D.gallery.find(g => g.g === '投稿作品') || D.gallery[5];
  return [
    ['music', 'AI音楽', `全${D.songs.length}曲のリストとペルソナ`, latest && latest.cov, '♪'],
    ['image', 'AI画像', `${D.gallery.length}点のギャラリー`, img && img.f, '✿'],
    ['video', 'AI動画', 'MV・ショート・制作中の映像', D.vpub[0] && D.vpub[0].img, '▶'],
    ['game', 'AIゲーム', 'ブラウザで遊べるゲームとツール', 'img/mansha.webp', '★'],
    ['series', 'シリーズ', `${D.stories.length}つの物語と世界`, D.stories[0].hero, '❖'],
    ['chara', 'キャラクター', `${D.chars.length}人のなかまたち`, (D.chars[1] || {}).img, '☺'],
    ['opsm', 'OPSM', '自己紹介と沿革', D.chars[0].img, '◎'],
    ['links', 'リンク', 'Suno・YouTube・noteなど', persona && persona.f, '↗'],
  ];
}
function fixH(h){ return h ? h.replace(/^#story(?=-|$)/, '#series').replace(/^#movie$/, '#video').replace(/^#art$/, '#image').replace(/^#(about|index)$/, '#opsm').replace(/^#history$/, '#opsm-history') : h; }
function viewTop(){
  const latest = D.songs.filter(s => s.cov).slice(0, 12);
  return `<section class="hero arrive">
    <div class="bg" style="background-image:url(${BASE}h/momonga.webp)"></div>
    <div class="fireflies">${Array.from({length: 18}, () => `<i style="left:${rnd(2,98).toFixed(0)}%;top:${rnd(10,95).toFixed(0)}%;--d:${rnd(0,6).toFixed(1)}s;--t:${rnd(5,10).toFixed(1)}s"></i>`).join('')}</div>
    <div class="wrap in">
      <span class="en">Welcome to the hideout</span>
      <h1><small>ようこそ、</small>OPS<i>M</i>の<br>森の秘密基地へ</h1>
      <p>AIで音楽を作り、絵を描き、動画を撮り、ゲームを作る。<br>モモンガが案内する、おぽのひみつの創作基地です。</p>
      <div class="cta"><a class="btn lamp" href="#music">AI音楽を聴く ♪</a><a class="btn ghost" href="#opsm">OPSMってだれ？</a></div>
    </div>
    <div class="hmm">${mmSVG()}<span class="hb">ようこそ！</span></div>
  </section>
  <section class="blk"><div class="wrap">
    <div class="shead"><span class="en">Rooms</span><h2>基地のへや</h2></div>
    <div class="rooms">${rooms().map(([h, t, d, im, ic], i) => `<a class="room" href="#${h}" style="--i:${i}"><div class="pic">${im ? `<img src="${im}" alt="" loading="lazy">` : ''}</div><div class="sign"><span class="ic">${ic}</span><b>${t}</b><small>${d}</small></div></a>`).join('')}</div>
  </div></section>
  <section class="blk"><div class="wrap">
    <div class="shead"><span class="en">New Songs</span><h2>あたらしい曲</h2><a class="more" href="#music">全曲リスト →</a></div>
    <div class="hscroll">${latest.map(songCard).join('')}</div>
  </div></section>
  <section class="blk"><div class="wrap two">
    <div><div class="shead"><span class="en">News</span><h2>基地だより</h2></div>
      <ul class="news">${D.activity.slice(0, 8).map(a => { const h = fixH(a.href); return `<li><span class="num">${fmtD(a.d)}</span><span class="cat">${esc(a.c)}</span>${h ? `<a href="${h}"${tgt(h)}>${esc(a.t)}</a>` : `<b>${esc(a.t)}</b>`}</li>`; }).join('')}</ul>
    </div>
    <div><div class="shead"><span class="en">Pick Up</span><h2>いまのおすすめ</h2></div>
      <div class="picks">${D.ads.slice(0, 4).map(a => { const h = fixH(a.href); return `<a class="pick" href="${h}"${tgt(h)}>${a.img ? `<img src="${a.img}" alt="" loading="lazy">` : ''}<div><span class="k">${esc(a.k)}</span><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div></a>`; }).join('')}</div>
    </div>
  </div></section>`;
}

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
      <p class="btns">${s.suno ? `<a class="btn lamp" href="${s.suno}" target="_blank" rel="noopener">Sunoでフル再生 ↗</a>` : ''}${st ? `<a class="btn" href="#series-${st.k}">シリーズ「${esc(st.t)}」→</a>` : ''}${vids.map(v => `<a class="btn" href="${v.url}" target="_blank" rel="noopener">YouTubeで${esc(v.kind)} ↗</a>`).join('')}</p>
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
  return phead('Series', 'シリーズ', '曲から生まれた物語、キャラクターから広がる世界。') +
  `<div class="wrap"><div class="series">${D.stories.map(s => `<a class="ser" href="#series-${s.k}"><img src="${s.hero}" alt="" loading="lazy"><div class="in"><span class="en">${esc(s.en)}</span><h3>${esc(s.t)}</h3><p>${esc(s.lead)}</p><small>${esc(s.genre)}　${esc(s.since)}</small></div></a>`).join('')}</div>
  <div class="shead"><span class="en">Project Files</span><h2>企画メモ</h2></div>
  <div class="projs">${D.proj.map(p => `<div><span class="chip">${esc(p.k)}</span><b>${esc(p.t)}</b><p>${esc(p.d)}</p></div>`).join('')}</div></div>`;
}
function viewStory(k){
  const s = storyByK[k]; if (!s) return viewNotFound();
  const chars = D.chars.map((c, i) => [c, i]).filter(([c]) => c.st === k);
  const sl = s.so.map(id => songById[id]).filter(Boolean);
  const idx = D.stories.indexOf(s), nx = D.stories[(idx + 1) % D.stories.length];
  return `<section class="shero"><img src="${s.hero}" alt=""><div class="wrap in"><div class="crumb"><a href="#series">シリーズ</a> ／ ${esc(s.genre)}</div><span class="en">${esc(s.en)}</span><h1>${esc(s.t)}</h1><p>${esc(s.lead)}</p></div></section>
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
      <p><a class="btn" href="#series-${nx.k}">次のシリーズ：${esc(nx.t)} →</a></p>
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
  return phead('About OPSM', 'OPSM', 'AIで遊ぶEnjoy勢、おぽのこと。') +
  `<div class="wrap">${tabs([['opsm', '自己紹介'], ['opsm-history', '沿革']], 'opsm')}
  <div class="about"><div class="pic"><img src="${D.chars[0].img}" alt="モモンガのアイコン"></div><div class="prose">
    <h2>OPSM（おぽ）です</h2>
    <p>名前の由来は「オポッサム」です。かわいい動物の名前にしたかったのですが、有名な動物の名前はすでに使われていることが多く、個性を出すのが難しいと思いました。そこで、あまり被らなさそうで少しユニークな動物として、オポッサムを選びました。</p>
    <p>ただ、そのままだと少し長いので、DAIGOさんのような略し方のノリでOPSMに。そして、もっと気軽に呼んでもらえるように「おぽ」という呼び名もつけています。アイコンは、初MVをきっかけにモモンガになりました。</p>
    <h2>創作スタンス</h2>
    <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやっています。「やってみたい！」が軸のEnjoy勢です。自分が聴きたい曲をAIに作ってもらっていますが、思い通りにするのは本当に難しい。みなさんのセンスと創作力には圧倒されつつ、元気ももらっています。</p>
    <p>純粋に楽しいからやる「一次的欲求」を大切に。需要は頭の片隅に置きつつ、誰かのなぞりにはしない。作品を出すことが、クリエイターとしての存在証明だと思っています。</p>
  </div></div>
  <div class="stats">${[['曲', st.songs], ['画像', st.images], ['キャラクター', st.chars], ['シリーズ', st.stories], ['活動', st.months + 'か月']].map(([a, b]) => `<div><b class="num">${b}</b><small>${a}</small></div>`).join('')}</div>
  <div class="shead"><span class="en">Toolbox</span><h2>使っている道具</h2></div>
  <div class="tags">${tools.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`;
}
function viewHistory(){
  return phead('About OPSM', 'OPSM', '2025年6月にSunoと出会ってから、今日まで。') +
  `<div class="wrap">${tabs([['opsm', '自己紹介'], ['opsm-history', '沿革']], 'opsm-history')}
  <ol class="tl">${D.history.slice().reverse().map(h => { const [y, m] = h.m.split('-'); const s = h.so && songById[h.so]; return `<li><div class="ym num">${+m}月<small>${y}</small></div><div class="c"><h3>${esc(h.h)}</h3><p>${esc(h.d)}</p>${s ? `<a href="#song-${s.id}">♪ ${esc(s.t)} →</a>` : ''}</div></li>`; }).join('')}</ol></div>`;
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
  if (h === 'top' || h === '') { html = viewTop(); nav = ''; }
  else if (h === 'music') { html = viewMusic(); init = initMusic; }
  else if (h === 'music-persona') { html = viewPersona(); init = () => bindLB(D.gallery.filter(g => g.g === 'ペルソナ・アイコン')); }
  else if (h.startsWith('song-')) { html = viewSong(h.slice(5)); nav = 'music'; }
  else if (h === 'image') { html = viewImage(); init = initImage; }
  else if (h === 'video') html = viewVideo();
  else if (h === 'game') html = viewGame();
  else if (h === 'series') html = viewSeries();
  else if (h.startsWith('series-')) html = viewStory(h.slice(7));
  else if (h === 'chara') { html = viewChara(); init = initChara; }
  else if (h === 'opsm') html = viewOpsm();
  else if (h === 'opsm-history') html = viewHistory();
  else if (h === 'links') html = viewLinks();
  else html = viewNotFound();
  app.innerHTML = html;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + nav));
  if (init) init();
  setPP();
  if (!document.documentElement.classList.contains('intro-on')) window.scrollTo(0, 0);
  const t = $('h1', app); document.title = (nav === '' || !t ? 'OPSMの森の秘密基地' : t.textContent.trim() + '｜OPSMの森の秘密基地');
}
window.addEventListener('hashchange', route);
route();
setPP();
if (document.documentElement.classList.contains('intro-on')) runIntro();
})();
