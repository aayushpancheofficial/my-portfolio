document.addEventListener('DOMContentLoaded', () => {
    // --- GOOGLE DRIVE RESUME LINK CONFIGURATION ---
    // 1. Get your Google Drive Sharable Link (Make sure it's set to "Anyone with the link")
    // 2. It usually looks like: https://drive.google.com/file/d/1XyZ.../view?usp=sharing
    const DRIVE_FILE_URL = 'https://drive.google.com/file/d/1GskSQsf2emS5Bm6lJgQ0An9KqIbzRcgK/view?usp=sharing'; // <-- PASTE YOUR LINK HERE

    const resumeIframe = document.getElementById('resumeIframe');
    const downloadBtn = document.getElementById('downloadResume');

    if (DRIVE_FILE_URL && DRIVE_FILE_URL !== '') {
        // Extract File ID from the URL
        const fileIdMatch = DRIVE_FILE_URL.match(/\/d\/(.+?)\//);
        
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            
            // Format for Embedding
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            
            // Format for Downloading
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            
            // Set values
            if (resumeIframe) resumeIframe.src = embedUrl;
            if (downloadBtn) downloadBtn.href = downloadUrl;
        } else {
            console.error("Invalid Google Drive Link. Please use a link like: https://drive.google.com/file/d/FILE_ID/view");
        }
    }

    // Add some flair - Fade in effect
    const container = document.querySelector('.resume-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        container.style.transition = 'all 0.8s ease-out';
        
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});



        // --- THEME CHANGER LOGIC (Reused from index.html) ---
        const THEMES = {
            space: { label: 'Night Mode', icon: '<i class="ph ph-planet"></i>', type: 'image', src: 'images/night.jpg' },
            rain: { label: 'Rain Mode', icon: '<i class="ph ph-cloud-rain"></i>', type: 'image', src: 'images/rain.jpg' },
            snow: { label: 'Snow Mode', icon: '<i class="ph ph-snowflake"></i>', type: 'video', src: 'videos/snow.mp4' },
            sun: { label: 'Sunny Mode', icon: '<i class="ph ph-sun"></i>', type: 'video', src: 'videos/sunny.mp4' },
            forest: { label: 'Forest Mode', icon: '<i class="ph ph-tree-evergreen"></i>', type: 'video', src: 'videos/2.mp4' },
            new: { label: 'Aesthetic Mode', icon: '<i class="ph ph-sparkles"></i>', type: 'code' }
        };

        const bodyEl = document.body;
        const themeIconSpan = document.getElementById('themeIcon');
        const themeLabelSpan = document.getElementById('themeLabel');
        const themeOptions = document.querySelectorAll('.theme-option');
        const themeSwitcherDiv = document.getElementById('themeSwitcher');
        const themeBtnDiv = document.getElementById('themeBtn');

        function initSparklesCanvas(canvas) {
            const ctx = canvas.getContext('2d');
            let animationId;
            let mouse = { x: null, y: null };
            let particles = [];
            let sparkles = [];
            let meteors = [];

            // Procedural nebulae clouds swirling around the canvas center (Rotating Colors!)
            let nebulae = [
                { orbitRadius: 280, angle: 0, speed: 0.0006, radius: 420, color: 'rgba(139, 92, 246, 0.08)' }, // Purple
                { orbitRadius: 360, angle: Math.PI * 0.7, speed: -0.0004, radius: 480, color: 'rgba(14, 165, 233, 0.08)' }, // Cyan
                { orbitRadius: 180, angle: Math.PI * 1.4, speed: 0.0008, radius: 360, color: 'rgba(236, 72, 153, 0.06)' } // Pink/Magenta
            ];

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            resize();
            window.addEventListener('resize', resize);

            const onMouseMove = (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                if (Math.random() < 0.25) {
                    sparkles.push(new CosmicDust(mouse.x, mouse.y, true));
                }
            };
            window.addEventListener('mousemove', onMouseMove);

            class CosmicDust {
                constructor(x, y, isMouseSpark = false) {
                    this.x = x || Math.random() * canvas.width;
                    this.y = y || Math.random() * canvas.height;
                    this.isMouseSpark = isMouseSpark;

                    const depth = Math.random();
                    this.size = isMouseSpark ? Math.random() * 3.5 + 1 : depth * 1.8 + 0.4;
                    this.speedX = isMouseSpark ? (Math.random() - 0.5) * 1.6 : (Math.random() - 0.5) * 0.12 * (depth * 1.5 + 0.2);
                    this.speedY = isMouseSpark ? (Math.random() - 0.5) * 1.6 - 0.4 : (Math.random() - 0.5) * 0.12 - 0.04 * (depth * 1.5 + 0.2);
                    this.opacity = isMouseSpark ? 1.0 : Math.random();
                    this.fadeSpeed = isMouseSpark ? Math.random() * 0.015 + 0.008 : Math.random() * 0.002 + 0.001;

                    const colors = [
                        'rgba(192, 132, 252, ', // Purple
                        'rgba(56, 189, 248, ',  // Cyan
                        'rgba(244, 63, 94, ',   // Rose Pink
                        'rgba(253, 186, 116, ', // Star Gold
                        'rgba(255, 255, 255, '  // Pure White
                    ];
                    this.colorBase = colors[Math.floor(Math.random() * colors.length)];
                    this.angle = Math.random() * Math.PI * 2;
                    this.angularSpeed = Math.random() * 0.02 + 0.008;
                }

                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;

                    if (this.isMouseSpark) {
                        this.opacity -= this.fadeSpeed;
                    } else {
                        this.angle += this.angularSpeed;
                        this.opacity = 0.1 + Math.abs(Math.sin(this.angle)) * 0.9;

                        if (this.x < 0) this.x = canvas.width;
                        if (this.x > canvas.width) this.x = 0;
                        if (this.y < 0) this.y = canvas.height;
                        if (this.y > canvas.height) this.y = 0;
                    }
                }

                draw() {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.colorBase + this.opacity + ')';
                    ctx.shadowBlur = this.isMouseSpark ? 12 : 5;
                    ctx.shadowColor = this.colorBase + '0.8)';
                    ctx.fill();
                    ctx.restore();
                }
            }

            class Meteor {
                constructor() {
                    this.reset();
                }

                reset() {
                    this.x = Math.random() * canvas.width * 1.5;
                    this.y = -50;
                    this.length = Math.random() * 100 + 80;
                    this.speedX = -(Math.random() * 8 + 8);
                    this.speedY = Math.random() * 8 + 8;
                    this.opacity = 1.0;
                    this.fadeSpeed = Math.random() * 0.015 + 0.01;
                }

                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.opacity -= this.fadeSpeed;
                }

                draw() {
                    if (this.opacity <= 0) return;
                    ctx.save();
                    ctx.beginPath();
                    const gradient = ctx.createLinearGradient(
                        this.x, this.y,
                        this.x - this.speedX * 2, this.y - this.speedY * 2
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + this.opacity + ')');
                    gradient.addColorStop(0.5, 'rgba(56, 189, 248, ' + (this.opacity * 0.5) + ')');
                    gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = Math.random() * 1.5 + 1;
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x - this.speedX * 3, this.y - this.speedY * 3);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            const starCount = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
            for (let i = 0; i < starCount; i++) {
                particles.push(new CosmicDust());
            }

            // Parallax offsets
            let offsetX = 0;
            let offsetY = 0;

            function animate() {
                if (!canvas.isConnected || !document.body.classList.contains('new')) {
                    cancelAnimationFrame(animationId);
                    window.removeEventListener('resize', resize);
                    window.removeEventListener('mousemove', onMouseMove);
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 1. Mouse Gravity Parallax
                const targetOffsetX = (mouse.x ? (mouse.x - canvas.width / 2) * 0.08 : 0);
                const targetOffsetY = (mouse.y ? (mouse.y - canvas.height / 2) * 0.08 : 0);
                offsetX += (targetOffsetX - offsetX) * 0.05;
                offsetY += (targetOffsetY - offsetY) * 0.05;

                const cx = canvas.width / 2 + offsetX;
                const cy = canvas.height / 2 + offsetY;

                // 2. Swirling nebulae revolving in concentric orbits around dynamic center (Rotating Colors!)
                nebulae.forEach(n => {
                    n.angle += n.speed;
                    const nx = cx + n.orbitRadius * Math.cos(n.angle);
                    const ny = cy + n.orbitRadius * Math.sin(n.angle);

                    const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.radius);
                    grad.addColorStop(0, n.color);
                    grad.addColorStop(0.5, n.color.replace('0.08', '0.02').replace('0.06', '0.01'));
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                    ctx.beginPath();
                    ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                });

                // Shooting Stars
                if (Math.random() < 0.003 && meteors.length < 2) {
                    meteors.push(new Meteor());
                }

                // Stars background
                particles.forEach(p => {
                    p.update();
                    p.draw();
                });

                // Meteors
                for (let i = meteors.length - 1; i >= 0; i--) {
                    const m = meteors[i];
                    m.update();
                    m.draw();
                    if (m.opacity <= 0 || m.x < -100 || m.y > canvas.height + 100) {
                        meteors.splice(i, 1);
                    }
                }

                // Cursor Trails
                for (let i = sparkles.length - 1; i >= 0; i--) {
                    const s = sparkles[i];
                    s.update();
                    s.draw();
                    if (s.opacity <= 0) {
                        sparkles.splice(i, 1);
                    }
                }

                // Constellations
                ctx.strokeStyle = 'rgba(192, 132, 252, 0.04)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 80) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }

                animationId = requestAnimationFrame(animate);
            }

            animate();
        }

        function applyTheme(themeName) {
            const config = THEMES[themeName];
            if (!config) return;

            bodyEl.classList.remove('rain', 'snow', 'sun', 'forest', 'aurora', 'new');
            if (themeName !== 'space') bodyEl.classList.add(themeName);
            localStorage.setItem('aayush_theme', themeName);

            if (themeIconSpan) themeIconSpan.innerHTML = config.icon;
            if (themeLabelSpan) themeLabelSpan.innerHTML = config.label;
            themeOptions.forEach(opt => opt.classList.toggle('selected', opt.dataset.theme === themeName));

            const bgContainer = document.getElementById('dynamic-bg-container');
            if (bgContainer) {
                bgContainer.innerHTML = '';
                const newLayer = document.createElement('div');
                newLayer.className = 'bg-layer';
                newLayer.id = `bg-${themeName}`;

                let mediaElement;
                if (config.type === 'video') {
                    const encodedSrc = encodeURI(config.src);
                    mediaElement = document.createElement('video');
                    mediaElement.src = encodedSrc;
                    mediaElement.autoplay = true;
                    mediaElement.muted = true;
                    mediaElement.loop = true;
                    mediaElement.setAttribute('playsinline', '');
                    newLayer.appendChild(mediaElement);
                } else if (config.type === 'image') {
                    const encodedSrc = encodeURI(config.src);
                    mediaElement = document.createElement('img');
                    mediaElement.src = encodedSrc;
                    newLayer.appendChild(mediaElement);
                } else if (config.type === 'code') {
                    mediaElement = document.createElement('canvas');
                    mediaElement.className = 'code-bg-canvas';
                    newLayer.appendChild(mediaElement);
                    initSparklesCanvas(mediaElement);
                }
                bgContainer.appendChild(newLayer);
            }
        }

        if (themeBtnDiv) themeBtnDiv.addEventListener('click', (e) => { e.stopPropagation(); themeSwitcherDiv.classList.toggle('open'); });
        themeOptions.forEach(opt => opt.addEventListener('click', (e) => { e.stopPropagation(); applyTheme(opt.dataset.theme); themeSwitcherDiv.classList.remove('open'); }));
        document.addEventListener('click', () => themeSwitcherDiv.classList.remove('open'));

        const savedTheme = localStorage.getItem('aayush_theme') || 'space';
        setTimeout(() => applyTheme(savedTheme), 10);
