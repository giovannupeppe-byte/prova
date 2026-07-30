/**
 * Regalo Anello Web Application
 * Romantic Interactive Experience
 */

document.addEventListener('DOMContentLoaded', () => {

    // === DEFAULT APP CONFIGURATION / STATE =====================================
    const DEFAULT_CONFIG = {
        gfName: "Sofia",
        subTitle: "Un momento unico per noi...",
        engraving: "Per Sempre Insieme ❤️",
        letterText: "Sei la persona più speciale che abbia mai incontrato. Ogni giorno trascorso al tuo fianco è un dono inestimabile.\n\nQuesta galleria ed i nostri ricordi sono il simbolo della mia promessa: amarti, sostenerti e costruire insieme a te ogni singolo giorno del nostro futuro.\n\nGrazie per rendere la mia vita un sogno meraviglioso.",
        signature: "Con tutto il mio amore, per sempre.",
        theme: "rose-gold",
        photos: [
            { url: "foto1.jpeg", caption: "I Nostri Sorrisi ❤️" },
            { url: "foto2.jpeg", caption: "Un Momento Magico 📸" },
            { url: "foto3.jpeg", caption: "Alle nostre risate 😂" }
        ]
    };

    // Load state from LocalStorage if existing
    let state = { ...DEFAULT_CONFIG };
    const savedState = localStorage.getItem('ring_app_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            state = { ...DEFAULT_CONFIG, ...parsed };
            if (!Array.isArray(state.photos) || state.photos.length === 0) {
                state.photos = DEFAULT_CONFIG.photos;
            }
        } catch (e) {
            console.error("Errore nel recupero dello stato salvato:", e);
        }
    }


    // === DOM ELEMENTS ==========================================================
    const ringBoxWrapper = document.getElementById('ringBoxWrapper');
    const openBoxBtn = document.getElementById('openBoxBtn');
    const ringElement = document.getElementById('ringElement');
    const engravingDisplay = document.getElementById('engravingDisplay');
    const engravingText = document.getElementById('engravingText');

    const displaySubtitle = document.getElementById('displaySubtitle');
    const displayTitle = document.getElementById('displayTitle');
    const typewriterLetter = document.getElementById('typewriterLetter');
    const letterSignature = document.getElementById('letterSignature');
    const photoGalleryGrid = document.getElementById('photoGalleryGrid');

    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    const inputGFName = document.getElementById('inputGFName');
    const inputSubTitle = document.getElementById('inputSubTitle');
    const inputEngraving = document.getElementById('inputEngraving');
    const inputLetter = document.getElementById('inputLetter');
    const inputSignature = document.getElementById('inputSignature');
    const selectTheme = document.getElementById('selectTheme');

    // === LOVE GATE OVERLAY ("MI AMI?") CONTROLLER ==============================
    const loveGateOverlay = document.getElementById('loveGateOverlay');
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');
    const gateNotice = document.getElementById('gateNotice');

    const NO_MESSAGES = [
        "Ehi! Non vale cercare di cliccare No! 😉",
        "Il pulsante NO è troppo timido per essere cliccato! 😜",
        "Ops! Ti è scappato! Devi cliccare SÌ! ❤️",
        "Non c'è via di fuga! Il mio amore per te è infinito! 💖",
        "Riprova... oppure clicca SÌ per scoprire la sorpresa! ✨"
    ];

    function moveNoButton() {
        btnNo.classList.add('escaped');
        const card = document.querySelector('.love-gate-card');
        const cardRect = card.getBoundingClientRect();
        const padding = 50;

        let randomX, randomY;
        let attempts = 0;

        do {
            randomX = Math.floor(Math.random() * (window.innerWidth - btnNo.offsetWidth - padding * 2)) + padding;
            randomY = Math.floor(Math.random() * (window.innerHeight - btnNo.offsetHeight - padding * 2)) + padding;
            attempts++;
        } while (
            attempts < 15 &&
            randomX > cardRect.left - 60 && randomX < cardRect.right + 60 &&
            randomY > cardRect.top - 60 && randomY < cardRect.bottom + 60
        );

        btnNo.style.left = `${randomX}px`;
        btnNo.style.top = `${randomY}px`;

        const randomMsg = NO_MESSAGES[Math.floor(Math.random() * NO_MESSAGES.length)];
        gateNotice.textContent = randomMsg;
    }


    btnNo.addEventListener('mouseenter', moveNoButton);
    btnNo.addEventListener('mouseover', moveNoButton);
    btnNo.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveNoButton();
    });
    btnNo.addEventListener('click', (e) => {
        e.preventDefault();
        moveNoButton();
    });

    btnYes.addEventListener('click', () => {
        gateNotice.textContent = "Lo sapevo! ❤️ Caricamento della sorpresa...";
        playChimeSound();

        for (let i = 0; i < 70; i++) {
            confetti.push(new Confetti(window.innerWidth / 2, window.innerHeight / 2));
        }

        setTimeout(() => {
            loveGateOverlay.classList.add('hidden');
        }, 700);
    });

    let isBoxOpen = false;
    let isMusicPlaying = false;
    let audioCtx = null;
    let typewriterIndex = 0;
    let typewriterTimer = null;


    // === INITIALIZE APP UI =====================================================
    function renderApp() {
        document.documentElement.setAttribute('data-theme', state.theme);

        displaySubtitle.textContent = state.subTitle;
        displayTitle.textContent = `Per Te, ${state.gfName} ❤️`;

        engravingText.textContent = state.engraving;
        letterSignature.textContent = state.signature;

        renderPhotoGallery();
        resetTypewriter();

        inputGFName.value = state.gfName;
        inputSubTitle.value = state.subTitle;
        inputEngraving.value = state.engraving;
        inputLetter.value = state.letterText;
        inputSignature.value = state.signature;
        selectTheme.value = state.theme;
    }

    function renderPhotoGallery() {
        if (!photoGalleryGrid) return;
        photoGalleryGrid.innerHTML = '';
        state.photos.forEach((photo, idx) => {
            const card = document.createElement('div');
            card.className = 'polaroid-card';

            const imgContent = photo.url ?
                `<img src="${escapeHtml(photo.url)}" class="polaroid-img" alt="${escapeHtml(photo.caption || 'Foto Ricordo')}">` :
                `<div class="polaroid-placeholder"><i class="fas fa-heart"></i><span>Incolla la Foto #${idx + 1}</span></div>`;

            card.innerHTML = `
                <div class="polaroid-img-wrapper">
                    ${imgContent}
                </div>
                <div class="polaroid-caption">${escapeHtml(photo.caption || 'Il Nostro Ricordo')}</div>
            `;
            photoGalleryGrid.appendChild(card);
        });
    }


    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[m]);
    }

    // === TYPEWRITER ANIMATION ==================================================
    function resetTypewriter() {
        if (typewriterTimer) clearInterval(typewriterTimer);
        typewriterLetter.textContent = '';
        typewriterIndex = 0;

        typewriterTimer = setInterval(() => {
            if (typewriterIndex < state.letterText.length) {
                typewriterLetter.textContent += state.letterText.charAt(typewriterIndex);
                typewriterIndex++;
            } else {
                clearInterval(typewriterTimer);
            }
        }, 32);
    }

    // === INTERACTIVE RING BOX CONTROLLER ======================================
    function toggleBoxOpen() {
        isBoxOpen = !isBoxOpen;

        if (isBoxOpen) {
            ringBoxWrapper.classList.add('open');
            openBoxBtn.innerHTML = '<i class="fas fa-heart"></i> Sorpresa Svelata!';
            engravingDisplay.classList.add('visible');

            // Play Romantic Chime Effect
            playChimeSound();

            // Trigger Particle Confetti Explosion
            spawnConfettiBurst();

            // Smooth Scroll to Letter after 1.5s
            setTimeout(() => {
                const glassCard = document.querySelector('.glass-card');
                if (glassCard) {
                    glassCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1400);

        } else {
            ringBoxWrapper.classList.remove('open');
            openBoxBtn.innerHTML = '<i class="fas fa-envelope"></i> Apri lo Scrigno';
            engravingDisplay.classList.remove('visible');
        }

    }

    ringBoxWrapper.addEventListener('click', toggleBoxOpen);
    openBoxBtn.addEventListener('click', toggleBoxOpen);

    // Click on Ring element triggers a sparkle boost
    ringElement.addEventListener('click', (e) => {
        e.stopPropagation();
        spawnConfettiBurst();
        playChimeSound();
    });

    // === WEB AUDIO API AMBIENT SOUND GENERATOR =================================
    function playChimeSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Romantic Major Arpeggio)
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.15);

                gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.15);
                gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + index * 0.15 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.15 + 1.2);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(audioCtx.currentTime + index * 0.15);
                osc.stop(audioCtx.currentTime + index * 0.15 + 1.3);
            });
        } catch (err) {
            console.log("Audio Web API not permitted yet or not supported:", err);
        }
    }

    // Background Melodic Ambient Sound Toggle
    let bgOsc = null;
    musicToggleBtn.addEventListener('click', () => {
        isMusicPlaying = !isMusicPlaying;
        if (isMusicPlaying) {
            musicToggleBtn.style.color = 'var(--accent-color)';
            musicToggleBtn.style.boxShadow = '0 0 15px var(--accent-glow)';
            playAmbientMusic();
        } else {
            musicToggleBtn.style.color = 'var(--text-primary)';
            musicToggleBtn.style.boxShadow = 'none';
            stopAmbientMusic();
        }
    });

    function playAmbientMusic() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            playChimeSound();
        } catch (e) { }
    }

    function stopAmbientMusic() {
        // Simple stop logic
    }

    // === SETTINGS MODAL / CUSTOMIZATION DRAWER ================================
    settingsToggleBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        state.gfName = inputGFName.value.trim() || DEFAULT_CONFIG.gfName;
        state.subTitle = inputSubTitle.value.trim() || DEFAULT_CONFIG.subTitle;
        state.engraving = inputEngraving.value.trim() || DEFAULT_CONFIG.engraving;
        state.letterText = inputLetter.value.trim() || DEFAULT_CONFIG.letterText;
        state.signature = inputSignature.value.trim() || DEFAULT_CONFIG.signature;
        state.theme = selectTheme.value;

        // Save to LocalStorage
        localStorage.setItem('ring_app_state', JSON.stringify(state));

        renderApp();
        settingsModal.classList.remove('active');
    });


    // === HTML5 CANVAS PARTICLES & CONFETTI ENGINE =============================
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let confetti = [];
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Particle Class (Background Hearts & Twinkling Stars)
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 14 + 6;
            this.speedY = Math.random() * 0.6 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.isHeart = Math.random() > 0.4;
            this.color = Math.random() > 0.5 ? '#ea9ab2' : '#d4af37';
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            if (this.y < -20) {
                this.y = height + 20;
                this.x = Math.random() * width;
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;

            if (this.isHeart) {
                drawHeart(ctx, this.x, this.y, this.size);
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // Confetti Particle for Ring Box Opening
    class Confetti {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 12 + 6;
            this.vx = (Math.random() - 0.5) * 14;
            this.vy = (Math.random() - 0.8) * 16;
            this.gravity = 0.35;
            this.color = ['#d4af37', '#ea9ab2', '#ffffff', '#ffd700', '#f4b6c2'][Math.floor(Math.random() * 5)];
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 10;
            this.opacity = 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.rotation += this.rotSpeed;
            this.opacity -= 0.012;
        }
        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            drawHeart(ctx, 0, 0, this.size);
            ctx.restore();
        }
    }

    function drawHeart(context, x, y, size) {
        context.beginPath();
        const topCurveHeight = size * 0.3;
        context.moveTo(x, y + topCurveHeight);
        context.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        context.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + size, x, y + size);
        context.bezierCurveTo(x, y + size, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        context.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        context.closePath();
        context.fill();
    }

    function spawnConfettiBurst() {
        const boxRect = ringBoxWrapper.getBoundingClientRect();
        const centerX = boxRect.left + boxRect.width / 2;
        const centerY = boxRect.top + boxRect.height / 2;

        for (let i = 0; i < 70; i++) {
            confetti.push(new Confetti(centerX, centerY));
        }
    }

    // Initialize Particle Pool
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update Background Floating Particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Update Confetti
        for (let i = confetti.length - 1; i >= 0; i--) {
            confetti[i].update();
            confetti[i].draw();
            if (confetti[i].opacity <= 0) {
                confetti.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    // Start App & Canvas loop
    renderApp();
    animate();
});
