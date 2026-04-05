document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mainNav.classList.toggle('active');
            
            // Animate hamburger icon
            const spans = mobileMenuBtn.querySelectorAll('span');
            if (mobileMenuBtn.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -8px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Close mobile menu on link click
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) {
                mobileMenuBtn.click();
            }
        });
    });

    // Active state for navigation based on scroll
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            // Adjust offset to trigger slightly before the section reaches top
            const sectionTop = section.offsetTop;
            if (pageYOffset >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Load Discography Data
    const discoGrid = document.getElementById('discography-grid');
    if (discoGrid) {
        fetch('assets/music_data.json')
            .then(res => res.json())
            .then(data => {
                // Reverse to show newest first
                data.reverse().forEach(track => {
                    const card = document.createElement('div');
                    card.className = 'card audio-card';
                    
                    const cleanedTitle = track.title.replace(/^[0-9]+_/, ''); // Remove date prefix

                    const defaultImageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a25"/><circle cx="100" cy="100" r="40" fill="#00f3ff" opacity="0.3"/><circle cx="100" cy="100" r="20" fill="#00f3ff"/></svg>';
                    const defaultImage = 'data:image/svg+xml,' + encodeURIComponent(defaultImageSvg);
                    
                    // Encode URI components to fix '#' and spaces
                    const encodePath = (path) => path ? path.split('/').map(encodeURIComponent).join('/') : null;
                    const encodedImage = encodePath(track.imageFile);
                    const encodedAudio = encodePath(track.audioFile);

                    const bgImage = encodedImage ? `url('${encodedImage}')` : `url('${defaultImage}')`;

                    const sunoLinkHtml = track.sunoUrl ? `<a href="${track.sunoUrl}" target="_blank" rel="noopener noreferrer" class="suno-link-icon" title="Listen on Suno"><img src="assets/links/SUNO/Suno.png" alt="Suno"></a>` : '';

                    card.innerHTML = `
                        <div class="card-image bg-blue" style="background-image: ${bgImage}; background-size: cover; background-position: center; position: relative;">
                            ${sunoLinkHtml}
                        </div>
                        <div class="card-content">
                            <h3 class="card-title" style="font-size: 1rem; margin-bottom: 1rem; word-break: break-all;">${cleanedTitle}</h3>
                            <audio controls controlsList="nodownload" oncontextmenu="return false;" preload="none" style="width: 100%;">
                                <source src="${encodedAudio}">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    `;
                    discoGrid.appendChild(card);

                    // Single play logic
                    const audioEl = card.querySelector('audio');
                    audioEl.addEventListener('play', function() {
                        document.querySelectorAll('audio').forEach(other => {
                            if (other !== this) other.pause();
                        });
                    });
                });
            })
            .catch(err => {
                discoGrid.innerHTML = '<p>音楽データの読み込みに失敗しました。</p>';
                console.error('Error loading music data:', err);
            });
    }

    // Load Character Data
    const charGrid = document.getElementById('characters-grid');
    if (charGrid) {
        fetch('assets/character_data.json')
            .then(res => res.json())
            .then(characters => {
                characters.forEach(char => {
                    const card = document.createElement('div');
                    card.className = 'card character-card';
                    
                    const defaultImageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a25"/><circle cx="100" cy="100" r="40" fill="#c8a2c8" opacity="0.3"/><circle cx="100" cy="100" r="20" fill="#c8a2c8"/></svg>';
                    const defaultImage = 'data:image/svg+xml,' + encodeURIComponent(defaultImageSvg);
                    
                    // Encode URI components to fix path loading issues
                    const encodePath = (path) => path ? path.split('/').map(encodeURIComponent).join('/') : null;
                    const encodedImage = encodePath(char.image);

                    const bgImage = encodedImage ? `url('${encodedImage}')` : `url('${defaultImage}')`;
                    
                    // Convert line breaks to <br> for description ensuring formatting is kept
                    const descriptionHtml = char.description.replace(/\n/g, '<br>');

                    card.innerHTML = `
                        <div class="card-image bg-purple" style="background-image: ${bgImage}; background-size: cover; background-position: top; border-bottom: 2px solid var(--pastel-purple); aspect-ratio: 1 / 1;">
                        </div>
                        <div class="card-content text-block">
                            <h3 class="card-title highlight-purple" style="font-size: 1.3rem; margin-bottom: 0.8rem;">${char.name}</h3>
                            <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6;">${descriptionHtml}</p>
                        </div>
                    `;
                    charGrid.appendChild(card);
                });
            })
            .catch(err => {
                charGrid.innerHTML = '<p>キャラクターデータの読み込みに失敗しました。</p>';
                console.error('Error loading character data:', err);
            });
    }

    // Load Art Gallery
    const artGrid = document.getElementById('art-gallery');
    if (artGrid) {
        fetch('assets/art_data.json')
            .then(res => res.json())
            .then(images => {
                images.forEach(imgSrc => {
                    const encodedImgSrc = imgSrc.split('/').map(encodeURIComponent).join('/');
                    const imgElement = document.createElement('img');
                    imgElement.src = encodedImgSrc;
                    imgElement.className = 'gallery-item';
                    imgElement.loading = 'lazy';
                    imgElement.addEventListener('click', () => openLightbox(imgElement.src));
                    artGrid.appendChild(imgElement);
                });
            })
            .catch(err => console.error('Error loading art data:', err));
    }

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    function openLightbox(src) {
        if(lightbox) {
            lightbox.classList.add('active');
            lightboxImg.src = src;
        }
    }

    if (closeBtn && lightbox) {
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.classList.remove('active');
            }
        });
    }
});
