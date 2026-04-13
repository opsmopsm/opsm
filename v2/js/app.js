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
        case 'links':
            content = renderLinks();
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
            <h1 class="page-title" style="font-size: 4rem;">OPSM <br>の秘密基地</h1>
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
        <div class="glass-panel text-block">
            <h3 style="color: var(--neon-blue); margin-bottom: 1rem;">About</h3>
            <p>AIを頼り、失敗しながら、色々調べながら、草の根魂でやってます。<br>
            『やってみたい！』が軸のEnjoy勢です。<br>
            自分たちの聴きたい曲をAIに作ってもらってますが、思い通りにするのは本当に難しい…<br>
            みなさんどうやって作ってんだろう。。。いろんな発想や手法がありそうです〜。。。<br>
            自分たちで歌詞を書くことも、難しいこともできないです。<br>
            みなさんのセンス、創作力には本当に圧倒されています。<br>
            それと元気ももらっております🎶</p>
            
            <h3 style="color: var(--pastel-purple); margin-top: 2rem; margin-bottom: 1rem;">名前の由来</h3>
            <p><strong>OPSM（おぽ）</strong></p>
            <p>名前の由来は「オポッサム」です。</p>
            <p>かわいい動物の名前にしたかったのですが、有名な動物はすでに使われていることが多く、個性を出すのが難しいと思いました。<br>
            そこで、あまり被らなさそうな動物としてオポッサムを選びました。<br>
            ただ、そのままだと少し長いので、DAIGOさんのような略し方のノリでOPSMに。<br>
            そして、もっと気軽に呼んでもらえるように<strong>「おぽ」</strong>という呼び名もつけています。</p>
        </div>
    `;
}

function getSafeUrl(path) {
    if (!path) return '';
    return path.split('/').map(encodeURIComponent).join('/');
}

function renderMusic() {
    const defaultImageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a25"/><circle cx="100" cy="100" r="40" fill="#00f3ff" opacity="0.8"/><circle cx="100" cy="100" r="20" fill="#c8a2c8"/></svg>';
    const defaultImage = 'data:image/svg+xml,' + encodeURIComponent(defaultImageSvg);

    let tiles = musicData.slice().reverse().map((track, i) => {
        const title = track.title.replace(/^[0-9]+_/, '');
        const bg = track.imageFile ? getSafeUrl(track.imageFile) : defaultImage;
        return `
            <div class="disco-tile" data-index="${i}" style="background-image: url('${bg}')">
                <div class="play-overlay">
                    <i data-lucide="info"></i>
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
        return `<img src="${getSafeUrl(src)}" class="gallery-img" alt="Artwork">`;
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
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/FsdgQFUMuzI" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/hBLeWna3n-Y" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/5K8a4vcYMlM" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
                <iframe width="100%" height="250" src="https://www.youtube.com/embed/QJFaJUD4qA8" title="YouTube" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
            </div>
        </div>
    `;
}

function renderSeries() {
    return `
        <h2 class="page-title">Series</h2>
        
        <div class="glass-panel" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;">
            <img src="assets/series/dosukoi-jah/TOP.png" style="width: 100%; max-width: 300px; border-radius: 12px;" alt="ドスコイジャー">
            <div style="flex: 1; min-width: 250px;" class="text-block">
                <h3 style="color: var(--neon-blue); margin-bottom: 1rem;">お相撲戦隊ドスコイジャー！</h3>
                <p><strong>【ストーリー】</strong></p>
                <p>遥か遠い宇宙の彼方から、突如として地球を襲った謎の宇宙人「ヒョロガリー」。<br>
                彼らの目的はただ一つ、豊かになりすぎた地球から全ての"豊かさ"を奪い去り、飢えに満ちた星に変えることだった。<br>
                食料を枯渇させ、人々を飢餓で痩せ細らせようとするヒョロガリーの猛攻に、世界は絶望の淵に立たされる。</p>
                <p>しかし、そんな危機に際し、古くから日本の地で豊かな肉体を育んできたある男たちが立ち上がった！<br>
                彼らこそ、日々鍛錬を積み、肉体を極めた相撲の道に生きる力士たち。<br>
                日本の国技に宿る「ドスコイ魂」を胸に、世界の豊かさと平和を取り戻すため、五人の力士が今、正義のヒーロー「お相撲戦隊ドスコイジャー」として土俵に上がる！</p>
                <p>果たして、お相撲戦隊ドスコイジャーは、飢えと豊かさの戦いに終止符を打ち、地球に再び満腹の平和をもたらすことができるのか！？</p>
                <p><strong>「おしだせ！世界の平和！」</strong><br>
                2026年春、スーパー戦隊シリーズ第〇〇１作品目。。。。になるわけない。。</p>

                <div style="margin-top: 20px;">
                     <button class="disco-modal-play" onclick="openVideoModal('${getSafeUrl('assets/series/dosukoi-jah/20251230_1927_01kdjsqxy7f3y90qhr8jx4p7b1.mp4')}')">
                           <i data-lucide="video"></i> 🎥 Movie を観る
                     </button>
                </div>
            </div>
        </div>
        
        <div class="glass-panel" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; margin-top: 40px;">
            <img src="assets/series/luna/dbaa391d-4114-4fdc-b3e1-a32f2304d253.png" style="width: 100%; max-width: 300px; border-radius: 12px; object-fit: contain; background: #000;" alt="ルナ">
            <div style="flex: 1; min-width: 250px;" class="text-block">
                <h3 style="color: var(--pastel-purple); margin-bottom: 1rem;">断腕の継承者ルナ</h3>
                <p><strong>■ 断腕の継承者ルナ</strong></p>
                <p>遠い未来、地球は宇宙の敵と戦争していました。<br>
                地球を襲った最強の人型兵器Akuma。<br>
                地球人はその右腕を断ち切ることに成功して追い払うことはできました。<br>
                しかし地球は戦争で荒廃しています。<br>
                戦争中に右腕を失ったルナ。<br>
                ルナの父は研究員でAkumaの落とした右腕を、人間に装備して戦う事が出来ないか軍事研究をしていました。<br>
                Akumaの右腕の適合者は、人類にただ1人。<br>
                娘のルナだけでした。頭を抱える父。<br>
                戦わなければ人類は滅びてしまう。<br>
                ルナは逃げたい気持ちを押し殺して、戦う事を決めました。</p>

                <div style="margin-top: 20px;">
                     <button class="disco-modal-play" onclick="openVideoModal('${getSafeUrl('assets/series/luna/変形ガード.mp4')}')">
                           <i data-lucide="video"></i> 🎥 Movie を観る
                     </button>
                </div>
            </div>
        </div>
    `;
}

function renderLinks() {
    return `
        <h2 class="page-title">Links</h2>
        <div class="glass-panel text-center">
            <h3 style="color: var(--text-secondary); margin-bottom: 30px;">External Links</h3>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                 <a href="https://suno.com/@opsm" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #333; color: white; border-radius: 8px; text-decoration: none;">Suno</a>
                 <a href="https://www.youtube.com/@OPSM_opsm" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #c4302b; color: white; border-radius: 8px; text-decoration: none;">YouTube</a>
                 <a href="https://www.tiktok.com/@opsm_opsm" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #000; color: white; border-radius: 8px; border: 1px solid #333; text-decoration: none;">TikTok</a>
                 <a href="https://www.chichi-pui.com/" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #2b70c4; color: white; border-radius: 8px; text-decoration: none;">ちちぷい</a>
                 <a href="https://www.aipictors.com/users/7218661c-88a6-f43e-5a90-08c52fb4da4d" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #2bc490; color: white; border-radius: 8px; text-decoration: none;">あいぴく</a>
                 <a href="https://note.com/opsm" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #2bc47e; color: white; border-radius: 8px; text-decoration: none;">Note</a>
                 <a href="https://x.com/OPSM_opsm" target="_blank" style="padding: 15px 30px; font-weight: bold; background: #1da1f2; color: white; border-radius: 8px; text-decoration: none;">X (Twitter)</a>
            </div>
        </div>
    `;
}

// Events
function attachMusicEvents() {
    const defaultImageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a25"/><circle cx="100" cy="100" r="40" fill="#00f3ff" opacity="0.3"/><circle cx="100" cy="100" r="20" fill="#00f3ff"/></svg>';
    const defaultImage = 'data:image/svg+xml,' + encodeURIComponent(defaultImageSvg);

    document.querySelectorAll('.disco-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
            const index = Number(e.currentTarget.dataset.index);
            const track = musicData.slice().reverse()[index];
            
            // Populate Modal
            document.getElementById('disco-modal-title').textContent = track.title.replace(/^[0-9]+_/, '');
            
            // Extract date from folder prefix (e.g. 260403 -> 2026/04/03)
            const dateMatch = track.title.match(/^([0-9]{2})([0-9]{2})([0-9]{2})_/);
            if (dateMatch) {
                document.getElementById('disco-modal-date').textContent = `20${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]} Release`;
            } else {
                document.getElementById('disco-modal-date').textContent = "";
            }

            document.getElementById('disco-modal-img').src = track.imageFile ? getSafeUrl(track.imageFile) : defaultImage;
            
            const sunoLink = document.getElementById('disco-modal-suno');
            if (track.sunoUrl) {
                sunoLink.href = track.sunoUrl;
                sunoLink.style.display = 'inline-flex';
            } else {
                sunoLink.style.display = 'none';
            }

            const playBtn = document.getElementById('disco-modal-play');
            // Remove old event listeners by cloning
            const newPlayBtn = playBtn.cloneNode(true);
            playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
            
            newPlayBtn.addEventListener('click', () => {
                playGlobalTrack(track);
                closeDiscoModal();
            });

            document.getElementById('disco-modal').classList.add('active');
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
    const defaultImageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a25"/><circle cx="100" cy="100" r="40" fill="#00f3ff" opacity="0.3"/><circle cx="100" cy="100" r="20" fill="#00f3ff"/></svg>';
    const defaultImage = 'data:image/svg+xml,' + encodeURIComponent(defaultImageSvg);

    const title = track.title.replace(/^[0-9]+_/, '');
    playerTitle.textContent = title;
    playerThumb.src = track.imageFile ? getSafeUrl(track.imageFile) : defaultImage;
    mainAudio.src = getSafeUrl(track.audioFile);
    mainAudio.play();
    globalPlayer.classList.remove('hidden');
    globalPlayer.classList.add('active');
}

window.closePlayer = function() {
    mainAudio.pause();
    globalPlayer.classList.remove('active');
}

window.closeDiscoModal = function() {
    document.getElementById('disco-modal').classList.remove('active');
}

window.openVideoModal = function(url) {
    const videoElem = document.getElementById('video-modal-content');
    videoElem.src = url;
    document.getElementById('video-modal').classList.add('active');
    videoElem.play();
}

window.closeVideoModal = function() {
    const videoElem = document.getElementById('video-modal-content');
    videoElem.pause();
    videoElem.src = '';
    document.getElementById('video-modal').classList.remove('active');
}

