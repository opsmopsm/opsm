// Globals
let musicData = [];
let artData = [];

// DOM Elements
const appRoot = document.getElementById('app-root');
const globalPlayer = document.getElementById('global-player');
const mainAudio = document.getElementById('main-audio');
const playerThumb = document.getElementById('player-thumb');
const playerTitle = document.getElementById('player-title');
const navLinks = document.querySelectorAll('.nav-link');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    
    // Fetch Data
    try {
        const mRes = await fetch('assets/music_data.json');
        musicData = await mRes.json();
    } catch(e) { console.warn('Music data not found', e); }

    try {
        const aRes = await fetch('assets/art_data.json');
        artData = await aRes.json();
    } catch(e) { console.warn('Art data not found', e); }
    
    // Setup Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = e.currentTarget.dataset.path;
            navigate(path);
            if (mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
            }
        });
    });

    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
    });

    // Default route
    navigate('home');
});

// Router
function navigate(path) {
    // Update active states
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-path="${path}"]`).forEach(l => l.classList.add('active'));

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let content = '';
    switch(path) {
        case 'home':
            content = renderHome();
            break;
        case 'about':
            content = renderAbout();
            break;
        case 'music':
            content = renderMusic();
            break;
        case 'art':
            content = renderArt();
            break;
        case 'movie':
            content = renderMovie();
            break;
        case 'series':
            content = renderSeries();
            break;
    }

    // Trigger transition
    appRoot.style.animation = 'none';
    appRoot.offsetHeight; /* trigger reflow */
    appRoot.style.animation = null;
    appRoot.innerHTML = content;
    
    lucide.createIcons();
    
    // Post render hooks
    if(path === 'music') attachMusicEvents();
    if(path === 'art') attachArtEvents();
}

// Pages
function renderHome() {
    return `
        <div class="hero-content">
            <h1 class="page-title" style="font-size: 4rem;">OPSM <br>AI Creative Base</h1>
            <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 2rem;">ゆっくりしていってくださいね(´▽｀)</p>
            <button class="nav-link" data-path="music" style="padding: 15px 30px; border-radius: 30px; border: none; background: linear-gradient(90deg, var(--neon-blue), var(--pastel-purple)); color: white; cursor: pointer; font-size: 1.1rem; font-weight: bold; box-shadow: 0 0 20px var(--pastel-purple-glow);">
                最新の楽曲を聴く
            </button>
        </div>
    `;
}

function renderAbout() {
    return `
        <h2 class="page-title">What's OPSM?</h2>
        <div class="glass-panel">
            <h3 style="color: var(--neon-blue); margin-bottom: 1rem;">About</h3>
            <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやってます。<br>
            『やってみたい！』が軸のEnjoy勢です。</p>
            <p>自分たちで歌詞を書くことも、難しいこともできないですが、皆さんのセンスから元気をもらっています🎶</p>
            
            <h3 style="color: var(--pastel-purple); margin-top: 2rem; margin-bottom: 1rem;">名前の由来</h3>
            <p><strong>OPSM（おぽ）</strong></p>
            <p>名前の由来は「オポッサム」です。あまり被らなさそうな動物を選び、DAIGOさんのような略し方でOPSMに！<br>もっと気軽に呼んでもらえるように「おぽ」という呼び名もつけています。</p>
        </div>
    `;
}

function renderMusic() {
    let tiles = musicData.slice().reverse().map((track, i) => {
        const title = track.title.replace(/^[0-9]+_/, '');
        const bg = track.imageFile ? track.imageFile : '';
        return `
            <div class="disco-tile" data-index="${i}" style="background-image: url('${encodeURI(bg)}')">
                <div class="play-overlay">
                    <i data-lucide="play-circle"></i>
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2 class="page-title">Discography</h2>
        <div class="glass-panel">
            <div class="disco-grid">
                ${tiles}
            </div>
        </div>
    `;
}

function renderArt() {
    let images = artData.map(src => {
        return `<img src="${encodeURI(src)}" class="gallery-img" alt="Artwork">`;
    }).join('');

    return `
        <h2 class="page-title">Art Gallery</h2>
        <div class="glass-panel">
            <div class="gallery-grid">
                ${images}
            </div>
        </div>
    `;
}

function renderMovie() {
    return `
        <h2 class="page-title">Movie</h2>
        <div class="glass-panel">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/XjL1bWc2ZJs" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/hBLeWna3n-Y" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/5K8a4vcYMlM" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
            </div>
        </div>
    `;
}

function renderSeries() {
    return `
        <h2 class="page-title">Series</h2>
        <div class="glass-panel">
            <h3 style="color: var(--neon-blue); margin-bottom: 1rem;">お相撲戦隊ドスコイジャー！</h3>
            <p>遥か遠い宇宙の彼方から、突如として地球を襲った謎の宇宙人「ヒョロガリー」。彼らの目的はただ一つ、貧しい星に変えることだった...</p>
        </div>
        <div class="glass-panel">
            <h3 style="color: var(--pastel-purple); margin-bottom: 1rem;">断腕の継承者ルナ</h3>
            <p>遠い未来、地球は宇宙の敵と戦争していました。最強の人型兵器Akumaの右腕を装備して戦う運命を背負った少女の物語。</p>
        </div>
    `;
}

// Events
function attachMusicEvents() {
    document.querySelectorAll('.disco-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
            const index = Number(e.currentTarget.dataset.index);
            const track = musicData.slice().reverse()[index];
            playGlobalTrack(track);
        });
    });
}

function attachArtEvents() {
    // Lightbox implementation
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    document.querySelectorAll('.gallery-img').forEach(img => {
        img.addEventListener('click', (e) => {
            lightboxImg.src = e.target.src;
            lightbox.classList.add('active');
        });
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox) lightbox.classList.remove('active');
    });
}

// Global Player
window.playGlobalTrack = function(track) {
    const title = track.title.replace(/^[0-9]+_/, '');
    playerTitle.textContent = title;
    playerThumb.src = track.imageFile ? encodeURI(track.imageFile) : '';
    mainAudio.src = encodeURI(track.audioFile);
    mainAudio.play();
    globalPlayer.classList.remove('hidden');
    globalPlayer.classList.add('active');
}

window.closePlayer = function() {
    mainAudio.pause();
    globalPlayer.classList.remove('active');
}
