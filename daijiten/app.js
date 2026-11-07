(function(){
'use strict';
const D = window.D;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const songById = Object.fromEntries(D.songs.map(s => [s.id, s]));
const storyByK = Object.fromEntries(D.stories.map(s => [s.k, s]));
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const isExt = h => /^https?:/.test(h);
const tgt = h => isExt(h) ? ' target="_blank" rel="noopener"' : '';

function fmtD(d){ const p = d.split('-'); return p.length === 3 ? `${p[0]}.${p[1]}.${p[2]}` : `${p[0]}.${p[1]}`; }
function hue(s){ let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) % 360; return h; }
function ph(t){ const h = hue(t); return `<div class="ph" style="background:linear-gradient(135deg,hsl(${h} 70% 42%),hsl(${(h+60)%360} 65% 22%))">${esc(t)}</div>`; }
function coverHTML(s, lazy = true){ return s.cov ? `<img src="${s.cov}" alt="${esc(s.t)} のジャケット" ${lazy ? 'loading="lazy"' : ''}>` : ph(s.t); }
function playBtn(s){ return s.au ? `<button class="play" type="button" data-play="${s.id}" aria-label="${esc(s.t)} を試聴">${ICON_PLAY}</button>` : ''; }
function songCard(s){
  const badge = s.tags.includes('未公開') ? '<span class="badge">未公開</span>' : (s.ev.length ? `<span class="badge">#${esc(s.ev[0])}</span>` : '');
  return `<div class="card"><div class="cover"><a href="#song-${s.id}" aria-label="${esc(s.t)}">${coverHTML(s)}</a>${badge}${playBtn(s)}</div><a href="#song-${s.id}" class="t">${esc(s.t)}</a><div class="m"><span class="num">${fmtD(s.d)}</span>${s.au ? '<span>♪ 試聴あり</span>' : ''}</div></div>`;
}
function charCard(c, i){
  const pic = c.img ? `<img src="${c.img}" alt="${esc(c.n)}" loading="lazy">` : `<div class="ini" style="background:${c.c || '#555'}">${esc(c.n[0])}</div>`;
  return `<button type="button" class="ccard" data-char="${i}"><div class="pic">${pic}</div><div class="bar" style="background:${c.c || 'var(--line)'}"></div><div class="in"><b>${esc(c.n)}</b><small>${esc(c.w)}</small></div></button>`;
}

/* ---------- ticker & footer ---------- */
$('#ticker').innerHTML = D.activity.slice(0, 8).map(a => `<a href="${a.href}"${tgt(a.href)}><b>${fmtD(a.d).slice(5)}</b>${esc(a.t)}</a>`).join('') + D.ads.map(a => `<a href="${a.href}"${tgt(a.href)}><b>${esc(a.k)}</b>${esc(a.t)}</a>`).join('');
$('#fcols').innerHTML = D.links.map(l => `<a href="${l.u}" target="_blank" rel="noopener">${esc(l.n)} ↗</a>`).join('');
$('#fbuilt').textContent = `収録：曲 ${D.stats.songs} ／ 画像 ${D.stats.images} ／ キャラクター ${D.stats.chars} ／ ストーリー ${D.stats.stories}　最終更新 ${D.built.replace(/-/g,'.')}　© OPSM（おぽ）`;

/* ---------- player ---------- */
const audio = $('#audio');
const queue = D.songs.filter(s => s.au).slice().reverse();
let cur = null, repeat = false;
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
audio.addEventListener('ended', () => repeat ? (audio.currentTime = 0, audio.play()) : step(1));
audio.addEventListener('timeupdate', () => { const p = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('#pprog i').style.width = p + '%'; $$('.pbig .bar i').forEach(b => { if (cur && b.dataset.id === cur.id) b.style.width = p + '%'; }); });
$('#ppp').onclick = () => cur ? play(cur.id) : step(0);
$('#pnext').onclick = () => step(1); $('#pprev').onclick = () => step(-1);
$('#prep').onclick = e => { repeat = !repeat; e.currentTarget.classList.toggle('on', repeat); };
$('#pprog').onclick = e => { if (audio.duration) audio.currentTime = e.offsetX / e.currentTarget.clientWidth * audio.duration; };
document.addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b){ e.preventDefault(); play(b.dataset.play); } });
setPP();

/* ---------- lightbox ---------- */
let lbList = [], lbI = 0;
function lbShow(i){ lbI = (i + lbList.length) % lbList.length; const g = lbList[lbI]; $('#lbi').src = g.f; $('#lbi').alt = g.l || ''; $('#lbc').textContent = `${g.l || g.g}　${lbI + 1} / ${lbList.length}`; $('#lb').classList.add('open'); }
$('#lbx').onclick = () => $('#lb').classList.remove('open');
$('#lbp').onclick = () => lbShow(lbI - 1); $('#lbn').onclick = () => lbShow(lbI + 1);
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') $('#lb').classList.remove('open'); });

/* ---------- character modal ---------- */
function openChar(i){
  const c = D.chars[i];
  const pic = c.img ? `<img src="${c.img}" alt="${esc(c.n)}">` : `<div class="ph" style="background:${c.c||'#555'};min-height:260px;font-size:60px;align-items:center;justify-content:center">${esc(c.n[0])}</div>`;
  const so = c.so.map(id => songById[id]).filter(Boolean).map(s => `<li><a href="#song-${s.id}">${esc(s.t)}</a></li>`).join('');
  $('#mbox').innerHTML = `<div class="pic">${pic}</div><div class="in"><button class="close" type="button" data-mclose>閉じる</button><span class="chip">${esc(c.w)}</span><h2>${esc(c.n)}</h2><p>${esc(c.d)}</p>${c.st ? `<p><a class="btn ink" href="#story-${c.st}" data-mclose>ストーリーを読む →</a></p>` : ''}${so ? `<div class="side"><h3 class="en">Songs</h3><ul class="mlist">${so}</ul></div>` : ''}</div>`;
  $('#modal').classList.add('open');
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-char]'); if (c){ openChar(+c.dataset.char); return; }
  if (e.target.closest('[data-mclose]') || e.target.id === 'modal') $('#modal').classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ $('#modal').classList.remove('open'); $('#lb').classList.remove('open'); $('#sov').classList.remove('open'); $('#drawer').classList.remove('open'); }
  if ($('#lb').classList.contains('open')){ if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1); }
});

/* ---------- drawer & search ---------- */
$('#hbtn').onclick = () => $('#drawer').classList.add('open');
$('#dclose').onclick = () => $('#drawer').classList.remove('open');
$$('#drawer a').forEach(a => a.addEventListener('click', () => $('#drawer').classList.remove('open')));
const ENTRIES = buildEntries();
function buildEntries(){
  const E = [];
  D.songs.forEach(s => E.push({ty:'曲', t:s.t, y:s.y, d:`${fmtD(s.d)}${s.note ? '　' + s.note : ''}`, h:'#song-' + s.id}));
  D.chars.forEach((c, i) => E.push({ty:'キャラ', t:c.n, y:c.y, d:`${c.w}　${c.d}`, h:'#chara', ci:i}));
  D.stories.forEach(s => E.push({ty:'物語', t:s.t, y:s.t === 'ポテチバンド／ロデオフィックス' ? 'ぽてちばんど' : null, d:s.lead, h:'#story-' + s.k}));
  D.gloss.forEach(g => E.push({ty:'用語', t:g.t, y:g.y, d:g.d, h:'#index'}));
  D.proj.forEach(p => E.push({ty:'企画', t:p.t, y:null, d:`${p.k}　${p.d}`, h:'#story'}));
  D.vpub.forEach(v => E.push({ty:'動画', t:v.t, y:null, d:v.d, h:v.url}));
  return E;
}
const yomiMap = {'断腕の継承者ルナ':'だんわんのけいしょうしゃるな','お相撲戦隊ドスコイジャー！':'おすもうせんたいどすこいじゃー','学級崩壊★カーニバル':'がっきゅうほうかいかーにばる','スペースシップの恋':'すぺーすしっぷのこい','ねぇ、運命だったよね？':'ねぇうんめいだったよね','エイリアンガールズ':'えいりあんがーるず','○○系女子':'まるまるけいじょし','ゆるっとAIホラー':'ゆるっとえーあいほらー','満員電車サバイバー':'まんいんでんしゃさばいばー','芽室まちもり大作戦！':'めむろまちもりだいさくせん','誕生日ソング':'たんじょうびそんぐ','若者のまるまる寄り':'わかもののまるまるより','資格試験の歌':'しかくしけんのうた','人魚バンド アクアリリィ':'にんぎょばんどあくありりぃ','君は僕の太陽さ MV':'きみはぼくのたいようさ','麻辣娘':'まーらーにゃん','ヘッドホン':'へっどほん','サバカン':'さばかん','とんでけ！モモンガ！ジャンピン！カックー！':'とんでけももんが','芽室のトウモロコシは':'めむろのとうもろこしは','テキーラディストーション -歪み-':'てきーらでぃすとーしょん','頼んでミーレ！アフォガード！':'たのんでみーれ','『学級崩壊★カーニバル』～short～':'がっきゅうほうかい'};
ENTRIES.forEach(e => { if (!e.y) e.y = yomiMap[e.t] || e.t; });
function searchHTML(q){
  q = q.trim().toLowerCase(); if (!q) return '<p class="count-line">曲名、キャラクター名、イベント名、用語などで検索できます。</p>';
  const r = ENTRIES.filter(e => (e.t + ' ' + e.y + ' ' + e.d).toLowerCase().includes(q)).slice(0, 80);
  return `<p class="count-line">${r.length}件</p>` + r.map(entryHTML).join('');
}
function entryHTML(e){ return `<a class="ient" href="${e.h}"${tgt(e.h)}${e.ci != null ? ` data-char="${e.ci}"` : ''}><span class="ty t-${e.ty}">${e.ty}</span><b>${esc(e.t)}<span class="yo">${e.y !== e.t && /^[ぁ-ゖー]/.test(e.y) ? esc(e.y) : ''}</span></b><small>${esc(e.d)}</small></a>`; }
$('#sbtn').onclick = () => { $('#sov').classList.add('open'); $('#sres').innerHTML = searchHTML(''); setTimeout(() => $('#sq').focus(), 30); };
$('#sx').onclick = () => $('#sov').classList.remove('open');
$('#sq').addEventListener('input', e => $('#sres').innerHTML = searchHTML(e.target.value));
$('#sres').addEventListener('click', e => { if (e.target.closest('a')) $('#sov').classList.remove('open'); });

/* ---------- views ---------- */
let heroTimer = null;
function phead(en, jp, p, crumb){ return `<div class="wrap"><div class="phead">${crumb ? `<div class="crumb">${crumb}</div>` : ''}<span class="en">${en}</span><h1>${jp}</h1>${p ? `<p>${p}</p>` : ''}</div></div>`; }

function viewTop(){
  const ads = D.ads;
  const latest = D.songs.filter(s => s.cov).slice(0, 14);
  const tiles = [
    ['#music', 'MUSIC', `音楽 ${D.stats.songs}曲`, 'h/flowers.webp'],
    ['#movie', 'MOVIE', '動画・MV', D.vpub[1].img],
    ['#art', 'ART', `画像 ${D.stats.images}点`, 'h/animal.webp'],
    ['#story', 'STORY', `ストーリー ${D.stats.stories}作`, 'h/luna2.webp'],
    ['#chara', 'CHARACTER', `キャラクター ${D.stats.chars}`, 'h/alien2.webp'],
    ['#history', 'HISTORY', '沿革 2025→', 'h/milestone.webp']];
  const feat = D.activity.find(a => a.img);
  return `
  <section class="hero" id="hero" aria-roledescription="carousel" aria-label="ピックアップ">
    ${ads.map((a, i) => `<div class="slide${i ? '' : ' on'}" aria-hidden="${i ? 'true' : 'false'}"><img src="${a.img}" alt="" ${i > 1 ? 'loading="lazy"' : ''}><div class="cap"><span class="kicker en" style="background:${a.tone}">${esc(a.k)}</span><h2>${esc(a.t)}</h2><p>${esc(a.s)}</p><a class="btn solid" href="${a.href}"${tgt(a.href)}>くわしく見る →</a></div></div>`).join('')}
    <div class="count en num" id="hcount">01 / ${String(ads.length).padStart(2,'0')}</div>
    <div class="dots">${ads.map((a, i) => `<button type="button" aria-label="${i + 1}枚目" data-dot="${i}" class="${i ? '' : 'on'}"></button>`).join('')}</div>
  </section>

  <section class="blk"><div class="wrap">
    <div class="shead"><div><span class="en">Latest Activity</span><h2>最近の行動</h2></div><a class="more" href="#history">沿革をすべて見る →</a></div>
    <div class="act">
      <a class="act-feature" href="${feat.href}"${tgt(feat.href)}><img src="${feat.img}" alt=""><div class="in"><span class="chip c-${feat.c}">${feat.c}</span><span class="en num" style="font-size:18px">${fmtD(feat.d)}</span><h3>${esc(feat.t)}</h3><p style="margin:0">${esc(feat.x)}</p></div></a>
      <ul class="alist">${D.activity.filter(a => a !== feat).slice(0, 7).map(a => { const [y, m, d] = a.d.split('-'); return `<li><a href="${a.href}"${tgt(a.href)}><span class="dt num"><b>${m}.${d}</b>${y}</span><span class="tt"><span class="chip c-${a.c}">${a.c}</span>${esc(a.t)}</span><span class="xx">${esc(a.x)}</span></a></li>`; }).join('')}</ul>
    </div>
  </div></section>

  <section class="blk tight"><div class="wrap">
    <div class="shead"><div><span class="en">Explore</span><h2>カテゴリから探す</h2></div></div>
    <div class="tiles">${tiles.map(t => `<a class="tile" href="${t[0]}"><img src="${t[3]}" alt="" loading="lazy"><span class="lb"><span class="en">${t[1]}</span><small>${t[2]}</small></span></a>`).join('')}</div>
  </div></section>

  <section class="blk tight" aria-label="ピックアップ広告">
    <div class="wrap"><div class="shead"><div><span class="en">Pick Up</span><h2>いま推したいもの</h2></div></div></div>
    <div class="adrow"><div class="adtrack">${[...ads, ...ads].map((a, i) => `<a class="ad" href="${a.href}"${tgt(a.href)} ${i >= ads.length ? 'aria-hidden="true" tabindex="-1"' : ''}><img src="${a.img}" alt="" loading="lazy"><span class="tag en">AD · OPSM</span><span class="in"><span class="kicker en" style="background:${a.tone};align-self:flex-start">${esc(a.k)}</span><h3>${esc(a.t)}</h3><p>${esc(a.s)}</p><span class="go">見に行く</span></span></a>`).join('')}</div></div>
  </section>

  <section class="blk"><div class="wrap">
    <div class="shead"><div><span class="en">New Music</span><h2>新しい曲</h2></div><a class="more" href="#music">全${D.stats.songs}曲を見る →</a></div>
    <div class="hs">${latest.map(songCard).join('')}</div>
  </div></section>

  <section class="blk band"><div class="wrap">
    <div class="shead"><div><span class="en">Stories</span><h2>ストーリー</h2></div><a class="more" href="#story">すべての物語 →</a></div>
    <p class="lede">曲から生まれ、画像で姿を持ち、小説と朗読で動き出す。OPSMの世界の物語たち。</p>
    <div class="stories">${D.stories.map((s, i) => `<a class="scard s${i}" href="#story-${s.k}"><img src="${s.hero}" alt="" loading="lazy"><div class="in"><span class="en">${esc(s.en)}</span><h3>${esc(s.t)}</h3>${i < 3 ? `<p>${esc(s.lead)}</p>` : ''}</div></a>`).join('')}</div>
  </div></section>

  <section class="blk"><div class="wrap">
    <div class="shead"><div><span class="en">By the Numbers</span><h2>数字で見るOPSM</h2></div></div>
    <div class="stats">
      <div class="stat"><b class="num">${D.stats.songs}</b><span>収録曲</span></div>
      <div class="stat"><b class="num">${D.stats.audio}</b><span>試聴できる曲</span></div>
      <div class="stat"><b class="num">${D.stats.images}</b><span>収録画像</span></div>
      <div class="stat"><b class="num">${D.stats.clips}</b><span>動画クリップ素材</span></div>
      <div class="stat"><b class="num">${D.stats.chars}</b><span>キャラクター</span></div>
      <div class="stat"><b class="num">${D.stats.months}</b><span>活動か月（2025.6〜）</span></div>
    </div>
  </div></section>

  <section class="blk tight"><div class="wrap">
    <div class="shead"><div><span class="en">Characters</span><h2>キャラクター図鑑</h2></div><a class="more" href="#chara">全員を見る →</a></div>
    <div class="cgrid">${D.chars.slice(0, 12).map((c, i) => charCard(c, i)).join('')}</div>
  </div></section>

  <section class="blk"><div class="wrap about">
    <div class="pic"><img src="${D.chars[0].img}" alt="モモンガ"></div>
    <div><span class="en" style="color:var(--accent);font-weight:800;letter-spacing:.14em">About OPSM</span><h2 style="font-size:clamp(28px,4vw,44px);font-weight:900;margin:6px 0 14px">OPSM（おぽ）の部屋へようこそ</h2>
    <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやっています。「やってみたい！」が軸のEnjoy勢。名前の由来はオポッサム。見かけたら、気軽に「おぽ」と呼んでください。</p>
    <p><a class="btn ink" href="#about">OPSMについて →</a></p></div>
  </div></section>`;
}
function initHero(){
  const sl = $$('.slide'), dots = $$('[data-dot]'); if (!sl.length) return;
  let i = 0;
  const go = n => { sl[i].classList.remove('on'); sl[i].setAttribute('aria-hidden','true'); dots[i].classList.remove('on'); i = (n + sl.length) % sl.length; sl[i].classList.add('on'); sl[i].setAttribute('aria-hidden','false'); dots[i].classList.add('on'); $('#hcount').textContent = `${String(i + 1).padStart(2,'0')} / ${String(sl.length).padStart(2,'0')}`; };
  const start = () => { clearInterval(heroTimer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setInterval(() => go(i + 1), 6000); };
  dots.forEach(d => d.onclick = () => { go(+d.dataset.dot); start(); });
  let x0 = null; const h = $('#hero');
  h.addEventListener('touchstart', e => x0 = e.touches[0].clientX, {passive:true});
  h.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40){ go(i + (dx < 0 ? 1 : -1)); start(); } x0 = null; });
  start();
}

/* music */
const FILTERS = ['すべて', '恋シリーズ', 'コミソン', 'イベント参加', 'シリーズ', 'インスト・BGM', 'リミックス・別Ver', '未公開'];
let mState = {f:'すべて', y:'all', q:'', sort:'new'};
function viewMusic(){
  const cnt = f => f === 'すべて' ? D.songs.length : D.songs.filter(s => s.tags.includes(f)).length;
  return phead('Music', `ディスコグラフィー　全${D.songs.length}曲`, `Sunoを中心に作ってきた曲を、ジャケットと一緒にまるごと収録。${D.stats.audio}曲は30秒の試聴つき、フル尺はSunoで聴けます。`) +
  `<div class="wrap"><div class="tools">${FILTERS.map(f => `<button type="button" class="fchip${mState.f === f ? ' on' : ''}" data-f="${f}">${f}<span class="n num">${cnt(f)}</span></button>`).join('')}</div>
  <div class="tools"><label class="sr" for="mq">曲を検索</label><input class="q" id="mq" type="search" placeholder="曲名で絞り込み" value="${esc(mState.q)}">
  <label class="sr" for="my">年</label><select class="q" id="my"><option value="all">すべての年</option><option value="2026">2026年</option><option value="2025">2025年</option></select>
  <label class="sr" for="ms">並び順</label><select class="q" id="ms"><option value="new">新しい順</option><option value="old">古い順</option><option value="kana">五十音順</option></select>
  <button type="button" class="btn ink" id="playall">${ICON_PLAY.replace('<svg','<svg width="16" height="16"')} 試聴を連続再生</button></div>
  <p class="count-line" id="mcount"></p><div class="grid" id="mgrid"></div></div>`;
}
function renderMusic(){
  let L = D.songs.filter(s => (mState.f === 'すべて' || s.tags.includes(mState.f)) && (mState.y === 'all' || s.d.startsWith(mState.y)) && (!mState.q || (s.t + s.y).toLowerCase().includes(mState.q.toLowerCase())));
  if (mState.sort === 'old') L = L.slice().reverse();
  if (mState.sort === 'kana') L = L.slice().sort((a, b) => a.y.localeCompare(b.y, 'ja'));
  $('#mcount').textContent = `${L.length}曲を表示中`;
  $('#mgrid').innerHTML = L.map(songCard).join('') || '<p>該当する曲がありません。条件をゆるめてみてください。</p>';
  setPP();
  return L;
}
function initMusic(){
  $('#my').value = mState.y; $('#ms').value = mState.sort;
  let L = renderMusic();
  $$('[data-f]').forEach(b => b.onclick = () => { mState.f = b.dataset.f; $$('[data-f]').forEach(x => x.classList.toggle('on', x === b)); L = renderMusic(); });
  $('#mq').oninput = e => { mState.q = e.target.value; L = renderMusic(); };
  $('#my').onchange = e => { mState.y = e.target.value; L = renderMusic(); };
  $('#ms').onchange = e => { mState.sort = e.target.value; L = renderMusic(); };
  $('#playall').onclick = () => { const f = L.find(s => s.au); if (f){ queue.length = 0; L.filter(s => s.au).forEach(s => queue.push(s)); cur = null; play(f.id); } };
}

/* song detail */
function viewSong(id){
  const s = songById[id]; if (!s) return viewNotFound();
  const i = D.songs.indexOf(s), newer = D.songs[i - 1], older = D.songs[i + 1];
  const st = s.ser && storyByK[s.ser];
  const chars = D.chars.map((c, ci) => [c, ci]).filter(([c]) => c.so.includes(s.id));
  const vids = D.vpub.filter(v => v.so === s.id);
  return `<div class="wrap"><div class="sd">
    <div class="cover">${coverHTML(s, false)}</div>
    <div>
      <div class="crumb"><a href="#music">音楽</a> ／ ${fmtD(s.d).slice(0, 4)}年</div>
      <div>${s.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <h1>${esc(s.t)}</h1>
      <div class="meta"><span>公開日 <b class="num">${fmtD(s.d)}</b></span>${s.ev.length ? `<span>イベント <b>${s.ev.map(e => '#' + esc(e)).join(' ')}</b></span>` : ''}${s.dur ? `<span>尺 <b class="num">${Math.floor(s.dur / 60)}:${String(s.dur % 60).padStart(2, '0')}</b></span>` : ''}<span>アーティスト <b>OPSM（おぽ）</b></span></div>
      ${s.au ? `<div class="pbig">${playBtn(s)}<div class="bar"><i data-id="${s.id}"></i></div><small>試聴 0:30</small></div>` : '<p class="count-line">この曲の音源はサイトに収録していません。</p>'}
      ${s.suno ? `<p><a class="btn ink" href="${s.suno}" target="_blank" rel="noopener">Sunoでフル再生 ↗</a></p>` : ''}
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
      ${st ? `<p><a class="btn" href="#story-${st.k}">ストーリー「${esc(st.t)}」へ →</a></p>` : ''}
      ${vids.map(v => `<p><a class="btn" href="${v.url}" target="_blank" rel="noopener">YouTubeで${esc(v.kind)}を見る ↗</a></p>`).join('')}
      ${chars.length ? `<div class="side" style="margin-top:20px"><h3 class="en">Characters</h3><div class="cgrid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">${chars.map(([c, ci]) => charCard(c, ci)).join('')}</div></div>` : ''}
      ${s.ly ? `<details class="ly" open><summary>歌詞</summary><div class="lyrics">${esc(s.ly)}</div></details>` : ''}
    </div></div>
    <div class="pn">${newer ? `<a href="#song-${newer.id}"><small>← 次に新しい曲</small>${esc(newer.t)}</a>` : '<span></span>'}${older ? `<a href="#song-${older.id}" style="text-align:right"><small>ひとつ前の曲 →</small>${esc(older.t)}</a>` : ''}</div>
  </div>`;
}

/* movie */
function viewMovie(){
  return phead('Movie', '動画・MV', `公開中のMVとショート、そして制作中の映像プロジェクト。手元の動画クリップ素材は${D.stats.clips}本以上。`) +
  `<div class="wrap"><div class="shead"><div><span class="en">On YouTube</span><h2>公開中</h2></div><a class="more" href="https://www.youtube.com/@OPSM_opsm" target="_blank" rel="noopener">チャンネルへ ↗</a></div>
  <div class="mv">${D.vpub.map(v => `<a class="mvc" href="${v.url}" target="_blank" rel="noopener"><div class="th"><img src="${v.img}" alt="" loading="lazy"><span class="yt"></span><span class="badge">${esc(v.kind)}</span></div><b>${esc(v.t)}</b><p>${esc(v.d)}</p></a>`).join('')}</div>
  <div class="shead" style="margin-top:72px"><div><span class="en">In Production</span><h2>制作中・映像素材</h2></div></div>
  <div class="wip">${D.vwip.map(v => `<div class="wipc"><div class="th">${v.video ? `<video src="${v.video}" poster="${v.img}" controls preload="none" playsinline></video>` : v.img ? `<img src="${v.img}" alt="" loading="lazy">` : '<div class="noimg en">COMING</div>'}<span class="st">${esc(v.st)}</span></div><div class="in"><b>${esc(v.t)}</b><p>${esc(v.d)}</p></div></div>`).join('')}</div></div>`;
}

/* art */
let artF = 'すべて';
function viewArt(){
  const groups = ['すべて', ...Array.from(new Set(D.gallery.map(g => g.g)))];
  return phead('Art', `画像ギャラリー　${D.gallery.length}点`, 'ちちぷい・あいぴくへの投稿作品、ジャケット、キャラクター設定画、プロジェクトのビジュアル。タップで拡大できます。') +
  `<div class="wrap"><div class="tools">${groups.map(g => `<button type="button" class="fchip${artF === g ? ' on' : ''}" data-g="${g}">${g}<span class="n num">${g === 'すべて' ? D.gallery.length : D.gallery.filter(x => x.g === g).length}</span></button>`).join('')}</div>
  <div class="tools"><a class="btn" href="https://www.chichi-pui.com/" target="_blank" rel="noopener">ちちぷい ↗</a><a class="btn" href="https://www.aipictors.com/users/7218661c-88a6-f43e-5a90-08c52fb4da4d" target="_blank" rel="noopener">あいぴく ↗</a></div>
  <div class="masonry" id="mas"></div></div>`;
}
function renderArt(){
  lbList = D.gallery.filter(g => artF === 'すべて' || g.g === artF);
  $('#mas').innerHTML = lbList.map((g, i) => `<button type="button" data-lb="${i}" aria-label="${esc(g.l || g.g)}を拡大"><img src="${g.f}" width="${g.w}" height="${g.h}" alt="${esc(g.l)}" loading="lazy"><span class="lb">${esc(g.l || g.g)}</span></button>`).join('');
  $$('[data-lb]').forEach(b => b.onclick = () => lbShow(+b.dataset.lb));
}
function initArt(){ renderArt(); $$('[data-g]').forEach(b => b.onclick = () => { artF = b.dataset.g; $$('[data-g]').forEach(x => x.classList.toggle('on', x === b)); renderArt(); }); }

/* stories */
function viewStories(){
  return phead('Story', 'ストーリー', '曲から生まれた物語、キャラクターから広がる世界。小説・AI朗読・MVへと育てている作品たち。') +
  `<div class="wrap"><div class="stories" style="margin-bottom:64px">${D.stories.map((s, i) => `<a class="scard s${i}" href="#story-${s.k}"><img src="${s.hero}" alt="" loading="lazy"><div class="in"><span class="en">${esc(s.en)}　${esc(s.since)}</span><h3>${esc(s.t)}</h3><p>${esc(s.lead)}</p></div></a>`).join('')}</div>
  <div class="shead"><div><span class="en">Project Files</span><h2>企画ファイル</h2></div></div>
  <div class="facts" style="columns:2 320px;column-gap:40px">${D.proj.map(p => `<div style="break-inside:avoid"><dt>${esc(p.k)}</dt><dd><b>${esc(p.t)}</b>　${esc(p.d)}</dd></div>`).join('')}</div></div>`;
}
function viewStory(k){
  const s = storyByK[k]; if (!s) return viewNotFound();
  const chars = D.chars.map((c, i) => [c, i]).filter(([c]) => c.st === k);
  const sl = s.so.map(id => songById[id]).filter(Boolean);
  const idx = D.stories.indexOf(s), nx = D.stories[(idx + 1) % D.stories.length];
  return `<section class="shero"><img src="${s.hero}" alt=""><div class="wrap in"><div class="crumb" style="color:#ccc"><a href="#story" style="color:#fff">ストーリー</a> ／ ${esc(s.genre)}</div><span class="en">${esc(s.en)}</span><h1>${esc(s.t)}</h1><p>${esc(s.lead)}</p></div></section>
  <section class="blk"><div class="wrap sbody">
    <div>
      <div class="prose">${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${s.video ? `<figure class="vbox" style="margin:32px 0"><video src="${s.video}" poster="${s.img2 || s.hero}" controls preload="none" playsinline></video><figcaption>${esc(s.video_cap || '')}</figcaption></figure>` : (s.img2 ? `<figure style="margin:32px 0"><img src="${s.img2}" alt="" loading="lazy" style="border-radius:var(--r)"></figure>` : '')}
      ${s.album ? `<div class="shead" style="margin-top:40px"><div><span class="en">Album</span><h2 style="font-size:28px">ロデオフィックス アルバム収録曲</h2></div></div><ol class="album">${s.album.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      ${chars.length ? `<div class="shead" style="margin-top:48px"><div><span class="en">Characters</span><h2 style="font-size:28px">登場キャラクター</h2></div></div><div class="cgrid">${chars.map(([c, i]) => charCard(c, i)).join('')}</div>` : ''}
      ${sl.length ? `<div class="shead" style="margin-top:48px"><div><span class="en">Songs</span><h2 style="font-size:28px">関連曲</h2></div></div><div class="grid">${sl.map(songCard).join('')}</div>` : ''}
    </div>
    <aside class="side">
      <h3 class="en">World Notes</h3>
      <dl class="facts">${s.world.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
      ${s.making && s.making.length ? `<h3 class="en" style="margin-top:32px">Making</h3><ul class="mlist">${s.making.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      ${s.yt ? `<p style="margin-top:20px"><a class="btn ink" href="${s.yt}" target="_blank" rel="noopener">YouTubeで見る ↗</a></p>` : ''}
      <p style="margin-top:32px"><a class="btn" href="#story-${nx.k}">次の物語：${esc(nx.t)} →</a></p>
    </aside>
  </div></section>`;
}

/* characters */
let chF = 'すべて';
function viewChara(){
  const works = ['すべて', ...Array.from(new Set(D.chars.map(c => c.w)))];
  return phead('Character', `キャラクター図鑑　${D.chars.length}`, '曲やストーリーに登場するキャラクターたち。カードを押すとプロフィールが開きます。') +
  `<div class="wrap"><div class="tools">${works.map(w => `<button type="button" class="fchip${chF === w ? ' on' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="cgrid" id="cg"></div></div>`;
}
function initChara(){
  const r = () => $('#cg').innerHTML = D.chars.map((c, i) => [c, i]).filter(([c]) => chF === 'すべて' || c.w === chF).map(([c, i]) => charCard(c, i)).join('');
  r(); $$('[data-w]').forEach(b => b.onclick = () => { chF = b.dataset.w; $$('[data-w]').forEach(x => x.classList.toggle('on', x === b)); r(); });
}

/* history */
function viewHistory(){
  return phead('History', '沿革', '2025年6月にSunoと出会ってから、今日まで。月ごとの歩み。') +
  `<div class="wrap"><ol class="tl">${D.history.slice().reverse().map(h => { const [y, m] = h.m.split('-'); const s = h.so && songById[h.so]; return `<li><div class="ym num">${m}月<small>${y}</small></div><div><h3>${esc(h.h)}</h3><p>${esc(h.d)}</p>${s ? `<a class="sl" href="#song-${s.id}">♪ ${esc(s.t)} →</a>` : ''}</div></li>`; }).join('')}</ol></div>`;
}

/* index */
const ROWS = [['あ','あいうえおぁぃぅぇぉゔ'],['か','かきくけこがぎぐげご'],['さ','さしすせそざじずぜぞ'],['た','たちつてとだぢづでどっ'],['な','なにぬねの'],['は','はひふへほばびぶべぼぱぴぷぺぽ'],['ま','まみむめも'],['や','やゆよゃゅょ'],['ら','らりるれろ'],['わ','わをん'],['A–Z','abcdefghijklmnopqrstuvwxyz'],['#','0123456789']];
function rowOf(y){ let c = (y || '').trim().toLowerCase().replace(/^[^ぁ-ゖァ-ヶa-z0-9]+/, '')[0] || '#'; if (/[ァ-ヶ]/.test(c)) c = String.fromCharCode(c.charCodeAt(0) - 96); const r = ROWS.find(([, s]) => s.includes(c)); return r ? r[0] : '#'; }
function viewIndex(){
  const g = {}; ENTRIES.forEach(e => (g[rowOf(e.y)] = g[rowOf(e.y)] || []).push(e));
  Object.values(g).forEach(l => l.sort((a, b) => a.y.localeCompare(b.y, 'ja')));
  return phead('Index', `索引　${ENTRIES.length}項目`, '曲・キャラクター・物語・用語・企画・動画を、五十音でひける大辞典の索引。') +
  `<div class="wrap"><nav class="kana" aria-label="五十音">${ROWS.map(([r]) => `<a href="#index" data-jump="ig-${ROWS.findIndex(x => x[0] === r)}" class="${g[r] ? '' : 'off'}">${r === 'A–Z' ? 'A' : r}</a>`).join('')}</nav>
  <div class="ig">${ROWS.filter(([r]) => g[r]).map(([r]) => `<h2 id="ig-${ROWS.findIndex(x => x[0] === r)}">${r}</h2>${g[r].map(entryHTML).join('')}`).join('')}</div></div>`;
}
function initIndex(){ $$('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) t.scrollIntoView({behavior:'smooth'}); }); }

/* about */
function viewAbout(){
  const tools = ['Suno','Suno Studio','Mureka','ちちぷい','あいぴく（Aipictors）','SeaArt','ChatGPT画像','Midjourney','Higgsfield','Kling','Seedance','Grok','fal.ai','Blender','Mixamo','DaVinci Resolve','Filmora','JIZURA','ElevenLabs','Style-Bert-VITS2','Cubase','Cakewalk','Ableton Note','Focusrite Scarlett 2i2','LPD8','Notion','note','Claude','Claude Code'];
  return phead('About', 'OPSM（おぽ）とは', '') + `<div class="wrap">
  <div class="about"><div class="pic"><img src="${D.chars[0].img}" alt="モモンガのアイコン"></div><div class="prose">
    <h2 style="font-size:28px;font-weight:900;margin-bottom:16px">名前の由来</h2>
    <p>名前の由来は「オポッサム」です。かわいい動物の名前にしたかったのですが、有名な動物の名前はすでに使われていることが多く、個性を出すのが難しいと思いました。そこで、あまり被らなさそうで少しユニークな動物として、オポッサムを選びました。</p>
    <p>ただ、そのままだと少し長いので、DAIGOさんのような略し方のノリでOPSMに。そして、もっと気軽に呼んでもらえるように「おぽ」という呼び名もつけています。アイコンは、初MVをきっかけにモモンガになりました。</p>
    <h2 style="font-size:28px;font-weight:900;margin:36px 0 16px">創作スタンス</h2>
    <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやっています。「やってみたい！」が軸のEnjoy勢です。自分が聴きたい曲をAIに作ってもらっていますが、思い通りにするのは本当に難しい。みなさんのセンスと創作力には圧倒されつつ、元気ももらっています。</p>
    <p>純粋に楽しいからやる「一次的欲求」を大切に。需要は頭の片隅に置きつつ、誰かのなぞりにはしない。作品を出すことが、クリエイターとしての存在証明だと思っています。</p>
  </div></div>
  <div class="shead" style="margin-top:64px"><div><span class="en">Toolbox</span><h2>使っている道具</h2></div></div>
  <div class="tools-list">${tools.map(t => `<span>${esc(t)}</span>`).join('')}</div>
  <div class="shead" style="margin-top:64px"><div><span class="en">Links</span><h2>OPSMの居場所</h2></div></div>
  <div class="links">${D.links.map(l => `<a href="${l.u}" target="_blank" rel="noopener"><b>${esc(l.n)}</b><small>${esc(l.h)}</small><span>${esc(l.d)} ↗</span></a>`).join('')}</div></div>`;
}
function viewNotFound(){ return phead('404', 'ページが見つかりません', '索引や検索から探してみてください。') + '<div class="wrap"><a class="btn ink" href="#top">トップへ戻る</a></div>'; }

/* ---------- router ---------- */
function route(){
  clearInterval(heroTimer);
  const h = (location.hash || '#top').slice(1);
  let html, init = null, nav = h.split('-')[0];
  if (h === 'top' || h === '') { html = viewTop(); init = initHero; nav = ''; }
  else if (h === 'music') { html = viewMusic(); init = initMusic; }
  else if (h.startsWith('song-')) { html = viewSong(h.slice(5)); nav = 'music'; }
  else if (h === 'movie') html = viewMovie();
  else if (h === 'art') { html = viewArt(); init = initArt; }
  else if (h === 'story') html = viewStories();
  else if (h.startsWith('story-')) { html = viewStory(h.slice(6)); nav = 'story'; }
  else if (h === 'chara') { html = viewChara(); init = initChara; }
  else if (h === 'history') html = viewHistory();
  else if (h === 'index') { html = viewIndex(); init = initIndex; }
  else if (h === 'about') html = viewAbout();
  else html = viewNotFound();
  app.innerHTML = html;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + nav));
  if (init) init();
  setPP();
  window.scrollTo(0, 0);
  const t = $('h1', app) || $('h2', app); document.title = (h === 'top' || !t ? 'OPSM大辞典' : t.textContent.trim().split('　')[0] + '｜OPSM大辞典');
}
window.addEventListener('hashchange', route);
route();
})();
