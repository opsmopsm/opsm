document.addEventListener('DOMContentLoaded', () => {

    /* --- Navigation Highlight --- */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').includes(current)) {
                a.classList.add('active');
            }
        });
    });

    /* --- Mobile Hamburger Menu --- */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    /* --- Audio Player Logic --- */
    const audioModal = document.getElementById('audioPlayerModal');
    const closeModalBtn = document.getElementById('closeModal');
    const mainAudio = document.getElementById('mainAudioControl');
    const nowPlayingTitle = document.getElementById('nowPlayingTitle');
    
    // Attach click events to work cards
    document.querySelectorAll('.work-card[data-url]').forEach(card => {
        card.addEventListener('click', (e) => {
            const audioUrl = card.getAttribute('data-url');
            const title = card.querySelector('h4').innerText;

            if (audioUrl && audioUrl !== "") {
                nowPlayingTitle.innerText = title;
                mainAudio.src = audioUrl;
                audioModal.classList.remove('hidden');
                audioModal.classList.add('flex-modal');
                mainAudio.play().catch(err => console.log("Auto-play blocked:", err));
            }
        });
    });

    // Close Modal
    if(closeModalBtn && audioModal) {
        closeModalBtn.addEventListener('click', () => {
            mainAudio.pause();
            audioModal.classList.add('hidden');
            audioModal.classList.remove('flex-modal');
        });
    }

});
