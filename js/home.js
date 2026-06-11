// --- THEME CHANGER & SPACE BACKGROUND ANIMATION ENGINE ---
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
  let scrollX = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const onMouseMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  window.addEventListener('mousemove', onMouseMove);

  const onMouseLeave = () => {
    mouse.x = null;
    mouse.y = null;
  };
  window.addEventListener('mouseleave', onMouseLeave);

  // Parallax offset variables
  let offsetX = 0;

  function animate() {
    if (!canvas.isConnected || !document.body.classList.contains('new')) {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle center radial background glow
    const centerGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 1.5);
    centerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
    centerGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.01)');
    centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mouse Parallax Lerp
    const targetOffsetX = (mouse.x ? (mouse.x - canvas.width / 2) * -0.05 : 0);
    offsetX += (targetOffsetX - offsetX) * 0.05;

    // Slowly scroll the grid to the right
    scrollX += 0.15;

    const lineSpacing = 120;
    const startX = (offsetX + scrollX) % lineSpacing - lineSpacing;
    const endX = canvas.width + lineSpacing;

    // Draw Vertical Lines
    for (let x = startX; x < endX; x += lineSpacing) {
      // Create a vertical gradient for the line to fade out at top/bottom
      const lineGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      lineGrad.addColorStop(0.15, 'rgba(56, 189, 248, 0.02)');
      lineGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.12)');
      lineGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.02)');
      lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Mouse interactive line glow / highlight
      if (mouse.x !== null && mouse.y !== null) {
        const distToLine = Math.abs(x - mouse.x);
        if (distToLine < 100) {
          const intensity = (1.0 - distToLine / 100) * 0.25;
          const glowGrad = ctx.createRadialGradient(x, mouse.y, 0, x, mouse.y, 120);
          glowGrad.addColorStop(0, `rgba(56, 189, 248, ${intensity})`);
          glowGrad.addColorStop(0.5, `rgba(192, 132, 252, ${intensity * 0.3})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(x, Math.max(0, mouse.y - 120));
          ctx.lineTo(x, Math.min(canvas.height, mouse.y + 120));
          ctx.strokeStyle = glowGrad;
          ctx.lineWidth = 2.0;
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
    // Check if we already have a matching background layer to prevent redundant re-renders and lag
    const existingLayer = bgContainer.querySelector('.bg-layer, #bg-new');
    const existingId = existingLayer ? existingLayer.id : null;
    const targetId = themeName === 'new' ? 'bg-new' : `bg-${themeName}`;

    if (existingLayer && existingId === targetId) {
      if (themeName === 'new') {
        const canvas = existingLayer.querySelector('canvas') || document.getElementById('sparkles-canvas');
        if (canvas && !canvas.dataset.initialized) {
          canvas.className = 'code-bg-canvas';
          canvas.dataset.initialized = 'true';
          initSparklesCanvas(canvas);
        }
      }
      return;
    }

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
    }
    bgContainer.appendChild(newLayer);

    if (config.type === 'code') {
      mediaElement.dataset.initialized = 'true';
      initSparklesCanvas(mediaElement);
    }
  }
}

function toggleDropdown(open) {
  if (themeSwitcherDiv) themeSwitcherDiv.classList.toggle('open', open);
}

if (themeBtnDiv) {
  themeBtnDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}

themeOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    applyTheme(opt.dataset.theme);
    toggleDropdown(false);
  });
});

document.addEventListener('click', () => toggleDropdown(false));

// Initial Load
const savedTheme = localStorage.getItem('aayush_theme') || 'new';
applyTheme(savedTheme);


const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// --- OPTIMIZED PARALLEL PARTICLE ENGINE (RAIN & SNOW) ---
(function initParticleEngine() {
  const rainCanvas = document.getElementById('rain-canvas');
  const snowCanvas = document.getElementById('snow-canvas');
  if (!rainCanvas && !snowCanvas) return;

  const bodyEl = document.body;
  
  let rainCtx = rainCanvas ? rainCanvas.getContext('2d', { alpha: true }) : null;
  let snowCtx = snowCanvas ? snowCanvas.getContext('2d', { alpha: true }) : null;

  let rainDrops = [];
  let snowFlakes = [];
  
  let rainAnimationId = null;
  let snowAnimationId = null;
  let isTabActive = true;

  // Responsive density adjustments
  function getParticleCounts() {
    const isMobile = window.innerWidth < 768;
    return {
      rain: isMobile ? 40 : 80, 
      snow: isMobile ? 30 : 60  
    };
  }

  function resizeCanvases() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    if (rainCanvas) {
      rainCanvas.width = w;
      rainCanvas.height = h;
    }
    if (snowCanvas) {
      snowCanvas.width = w;
      snowCanvas.height = h;
    }
  }

  // --- Rain Setup ---
  function initRain() {
    rainDrops = [];
    if (!rainCanvas) return;
    const count = getParticleCounts().rain;
    for (let i = 0; i < count; i++) {
      rainDrops.push({
        x: Math.random() * rainCanvas.width,
        y: Math.random() * rainCanvas.height,
        length: Math.random() * 15 + 10,
        speed: Math.random() * 8 + 6
      });
    }
  }

  function drawRain() {
    if (!isTabActive || !bodyEl.classList.contains('rain')) {
      rainAnimationId = null;
      return; 
    }

    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.strokeStyle = 'rgba(174, 219, 230, 0.4)';
    rainCtx.lineWidth = 1;
    rainCtx.lineCap = 'round';
    rainCtx.beginPath();

    for (let i = 0; i < rainDrops.length; i++) {
      const drop = rainDrops[i];
      rainCtx.moveTo(drop.x, drop.y);
      rainCtx.lineTo(drop.x, drop.y + drop.length);
      drop.y += drop.speed;
      if (drop.y > rainCanvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * rainCanvas.width;
      }
    }
    rainCtx.stroke();
    rainAnimationId = requestAnimationFrame(drawRain);
  }

  // --- Snow Setup ---
  function initSnow() {
    snowFlakes = [];
    if (!snowCanvas) return;
    const count = getParticleCounts().snow;
    for (let i = 0; i < count; i++) {
      snowFlakes.push({
        x: Math.random() * snowCanvas.width,
        y: Math.random() * snowCanvas.height,
        radius: Math.random() * 2 + 1, 
        speedY: Math.random() * 1.2 + 0.4,
        speedX: Math.random() * 0.8 - 0.4
      });
    }
  }

  function drawSnow() {
    if (!isTabActive || !bodyEl.classList.contains('snow')) {
      snowAnimationId = null;
      return; 
    }

    snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    snowCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    snowCtx.beginPath();

    for (let i = 0; i < snowFlakes.length; i++) {
      const flake = snowFlakes[i];
      snowCtx.moveTo(flake.x, flake.y);
      snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      flake.y += flake.speedY;
      flake.x += flake.speedX;
      
      if (flake.y > snowCanvas.height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * snowCanvas.width;
      }
    }
    snowCtx.fill();
    snowAnimationId = requestAnimationFrame(drawSnow);
  }

  // --- Theme Change Hook ---
  const originalApplyTheme = window.applyTheme;
  window.applyTheme = function(themeName) {
    if (typeof originalApplyTheme === 'function') {
      originalApplyTheme(themeName);
    }
    
    if (themeName === 'rain') {
      initRain();
      if (!rainAnimationId) drawRain();
    } else if (themeName === 'snow') {
      initSnow();
      if (!snowAnimationId) drawSnow();
    }
  };

  // --- Event Listeners ---
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvases();
      initRain();
      initSnow();
    }, 250); 
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isTabActive = false;
    } else {
      isTabActive = true;
      const currentTheme = localStorage.getItem('aayush_theme') || 'new';
      if (currentTheme === 'rain' && !rainAnimationId) drawRain();
      if (currentTheme === 'snow' && !snowAnimationId) drawSnow();
    }
  });

  // Initial load checks
  resizeCanvases();
  const initialTheme = localStorage.getItem('aayush_theme') || 'new';
  if (initialTheme === 'rain') {
    initRain();
    drawRain();
  } else if (initialTheme === 'snow') {
    initSnow();
    drawSnow();
  }
})();



let currentAudio = null;
let lastTrackName = "";
let lastIsNowPlaying = false;
let currentPreviewUrl = null;



const LASTFM_USERNAME = "aayushpanche"; // CHANGE THIS to your Last.fm username
const LASTFM_API_KEY = "71422aa8a9b819d17782285ece2fbe5d"; // CHANGE THIS to your Last.fm API Key

async function fetchSpotifyTracks(isPolling = false) {
  const cardWidget = document.getElementById('music-card-widget');
  const trackNameEl = document.getElementById('track-name');
  const trackArtistEl = document.getElementById('track-artist-container');
  if (!cardWidget || !trackNameEl) return;

  if (LASTFM_API_KEY === "YOUR_LASTFM_API_KEY") {
    trackNameEl.textContent = "Setup Last.fm";
    cardWidget.onclick = () => window.open('https://www.last.fm/api/account/create', '_blank');
    return;
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Last.fm fetch failed");

    const data = await response.json();
    const tracks = data?.recenttracks?.track;
    if (!tracks || tracks.length === 0) {
      if (!isPolling) trackNameEl.textContent = "Spotify Idle";
      return;
    }

    const track = tracks[0];
    const songName = track.name;
    const artistName = track.artist['#text'];
    const spotifyUrl = track.url;
    const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

    const playingLabel = cardWidget.querySelector('.spotify-label');
    const waveform = document.getElementById('spotify-waveform');

    if (isPolling && songName === lastTrackName && isNowPlaying === lastIsNowPlaying) return;

    if (playingLabel) playingLabel.textContent = isNowPlaying ? "Now Playing —" : "Last Played —";
    if (waveform) waveform.style.display = isNowPlaying ? 'flex' : 'none';

    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
    }

    lastTrackName = songName;
    lastIsNowPlaying = isNowPlaying;

    let previewUrl = null;
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(songName + " " + artistName)}&entity=song&limit=1`;
      let itunesRes = await fetch(itunesUrl);
      if (!itunesRes.ok) itunesRes = await fetch('https://corsproxy.io/?' + encodeURIComponent(itunesUrl));
      const itunesData = await itunesRes.json();
      if (itunesData.results?.length > 0) previewUrl = itunesData.results[0].previewUrl;
    } catch (e) { }

    currentPreviewUrl = previewUrl;

    trackNameEl.textContent = songName;
    trackArtistEl.innerHTML = ` &bull; ${artistName}`;
    trackArtistEl.style.display = 'inline';

    const playBtn = document.getElementById('spotify-play-btn');
    if (playBtn) {
      playBtn.style.display = 'inline-block';
      playBtn.title = previewUrl ? "Listen to preview" : "Play Lofi Fallback";
      if (!currentAudio || currentAudio.paused) {
        playBtn.className = "ph-fill ph-play-circle";
      }
    }

    cardWidget.onclick = () => window.open(spotifyUrl, '_blank');
    lastTrackUrl = spotifyUrl;

  } catch (error) {
    console.error("Last.fm Fetch Error:", error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Attach immediate click handler to Spotify card components
  const cardWidget = document.getElementById('music-card-widget');
  const spotifyIcon = cardWidget?.querySelector('.ph-spotify-logo');

  if (cardWidget) {
    cardWidget.style.cursor = 'pointer';
    cardWidget.onclick = () => {
      if (lastTrackUrl) {
        window.open(lastTrackUrl, '_blank');
      } else if (typeof LASTFM_USERNAME !== 'undefined' && LASTFM_USERNAME !== "YOUR_LASTFM_USERNAME") {
        window.open(`https://www.last.fm/user/${LASTFM_USERNAME}`, '_blank');
      }
    };
  }

  // Prevent play button clicks from triggering the card's login redirect, and handle play/pause functionality
  const globalPlayBtn = document.getElementById('spotify-play-btn');
  if (globalPlayBtn) {
    globalPlayBtn.style.display = 'inline-block';
    globalPlayBtn.style.cursor = 'pointer';
    globalPlayBtn.title = "Play music";

    globalPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const trackNameEl = document.getElementById('track-name');
      const trackArtistEl = document.getElementById('track-artist-container');
      const waveform = document.getElementById('spotify-waveform');

      const playUrl = currentPreviewUrl || "https://archive.org/download/moonwalk-sweet-memory-lofi-trip-hop/Moonwalk%20-%20Sweet%20Memory%20%28Lofi%20Trip-hop%29.mp3";

      if (currentAudio && !currentAudio.paused && currentAudio.src === playUrl) {
        currentAudio.pause();
        globalPlayBtn.className = "ph-fill ph-play-circle";
        if (waveform) waveform.style.display = 'none';

        if (!currentPreviewUrl) {
          trackNameEl.textContent = lastTrackName || "Connect Spotify";
          if (trackArtistEl) {
            trackArtistEl.style.display = lastTrackName ? 'inline' : 'none';
          }
        }
      } else {
        try {
          if (currentAudio) currentAudio.pause();
          currentAudio = new Audio(playUrl);

          currentAudio.play().then(() => {
            globalPlayBtn.className = "ph-fill ph-pause-circle";
            if (waveform) waveform.style.display = 'flex';

            if (!currentPreviewUrl) {
              trackNameEl.textContent = "Sweet Memory (Lofi)";
              if (trackArtistEl) {
                trackArtistEl.innerHTML = " &bull; Moonwalk";
                trackArtistEl.style.display = 'inline';
              }
            }
          }).catch(error => {
            console.error("Playback failed:", error);
            globalPlayBtn.className = "ph-fill ph-play-circle";
            if (waveform) waveform.style.display = 'none';
          });

          currentAudio.onended = () => {
            globalPlayBtn.className = "ph-fill ph-play-circle";
            if (waveform) waveform.style.display = 'none';
            if (!currentPreviewUrl) {
              trackNameEl.textContent = lastTrackName || "Connect Spotify";
              if (trackArtistEl) {
                trackArtistEl.style.display = lastTrackName ? 'inline' : 'none';
              }
            }
          };
        } catch (err) {
          console.error("Audio error:", err);
          globalPlayBtn.className = "ph-fill ph-play-circle";
          if (waveform) waveform.style.display = 'none';
        }
      }
    });
  }

  if (spotifyIcon) {
    spotifyIcon.style.cursor = 'pointer';
    spotifyIcon.onclick = (e) => {
      if (typeof LASTFM_USERNAME !== 'undefined' && LASTFM_USERNAME !== "YOUR_LASTFM_USERNAME") {
        window.open(`https://www.last.fm/user/${LASTFM_USERNAME}`, '_blank');
      }
    };
  }

  fetchSpotifyTracks();
  setInterval(() => fetchSpotifyTracks(true), 15000);
});

let lastTrackUrl = null;

const roles = ["Engineer", "Web Developer", "Animator", "Student"];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typeWriterElement = document.querySelector('.typewriter-text');

function typeWriter() {
  if (!typeWriterElement) return;
  const currentRole = roles[roleIndex];
  if (isDeleting) {
    typeWriterElement.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typeWriterElement.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
  }

  let speed = isDeleting ? 40 : 80;
  if (!isDeleting && charIndex === currentRole.length) {
    speed = 3000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    speed = 400;
  }
  setTimeout(typeWriter, speed);
}

document.addEventListener('DOMContentLoaded', () => {
  typeWriter();
  // Existing observer logic follows...
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show-scroll');
      else entry.target.classList.remove('show-scroll');
    });
  }, { threshold: 0.1 });

  const hiddenElements = document.querySelectorAll('.hidden-scroll, .hidden-scroll-left, .hidden-scroll-right, .hidden-scroll-up');
  hiddenElements.forEach((el) => observer.observe(el));

  let aboutStarted = false;
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !aboutStarted && window.scrollY > 50) {
        aboutStarted = true;
        changeAboutContent(aboutKeys[0], null);
        entry.target.classList.add('show-scroll');
      }
    });
  }, { threshold: 0.1 });

  const aboutContainer = document.querySelector('.about-section-container');
  if (aboutContainer) aboutObserver.observe(aboutContainer);

  const thumbs = document.querySelectorAll('.thumb-card');
  thumbs.forEach(thumb => {
    const pauseHandler = () => {
      isAboutPaused = true;
      if (aboutTimer) clearInterval(aboutTimer);
    };
    const resumeHandler = () => {
      if (isAboutPaused) {
        isAboutPaused = false;
        setTimeout(startAboutAutoPlay, 100);
      }
    };
    thumb.addEventListener('mousedown', pauseHandler);
    thumb.addEventListener('touchstart', pauseHandler, { passive: true });
    thumb.addEventListener('mouseup', resumeHandler);
    thumb.addEventListener('touchend', resumeHandler);
    thumb.addEventListener('mouseleave', resumeHandler);
  });
  // Images will load when the about section content changes.
});

const aboutData = {
  about: {
    title: "Hi, I'm Aayush",
    subtitle: "from Rampur, Chhattisgarh.",
    desc: "<p>Hi, I'm Aayush, born in the small village of Rampur, Khairagarh-Chhuikhadan-Gandai, Chhattisgarh. Currently, I’m pursuing my B.Tech degree from SSIPMT College, Raipur. I’m a hardworking and passionate learner interested in AI, technology, problem-solving and web development. I enjoy creating cool animated websites while continuously learning and improving my skills to create meaningful digital experiences.</p>",
    img: "images/abot-pic.png"
  },
  school: {
    title: "Schooling Journey",
    subtitle: "Gandai, Salhewara & Chhuikhadan",
    desc: "<p>I completed 1st to 8th in Gandai, then shifted to my village. Scored 83% in 10th (Govt. School, Salhewara) and 69% in 12th (Govt. School, Chhuikhadan). I also achieved an 83 percentile in JEE Mains.</p>",
    img: "images/school.png"
  },
  college: {
    title: "College / Degree",
    subtitle: "SSIPMT, Raipur (2022–2028 Batch)",
    desc: "<p>Pursuing B.Tech in Computer Science and Engineering at Shri Shankaracharya Professional Management and Technology (SSIPMT), Raipur. I am focused on learning programming, web development, AI, and frontend engineering. I secured a 7.0 CGPA in my first year.</p>",
    img: "images/college.png"
  },
  current: {
    title: "Current Goal",
    subtitle: "Full Stack Web Development",
    desc: "<p>Focusing on Full Stack development and UI/UX design.</p>",
    img: "images/goals.png"
  }
};

const aboutKeys = ['about', 'school', 'college', 'current'];
let currentAboutIndex = 0;
let aboutTimer = null;
let isAboutPaused = false;

function startAboutAutoPlay() {
  if (aboutTimer) clearInterval(aboutTimer);
  if (isAboutPaused) return;
  aboutTimer = setInterval(() => {
    currentAboutIndex = (currentAboutIndex + 1) % aboutKeys.length;
    changeAboutContent(aboutKeys[currentAboutIndex], null);
  }, 5000);
}

function changeAboutContent(key, element) {
  currentAboutIndex = aboutKeys.indexOf(key);
  const thumbs = document.querySelectorAll('.thumb-card');
  thumbs.forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');
  else thumbs[currentAboutIndex].classList.add('active');

  const data = aboutData[key];
  if (!data) return;

  const contentBox = document.getElementById('about-content-box');
  const mainImg = document.getElementById('about-main-img');
  mainImg.style.opacity = '0';
  contentBox.style.opacity = '0.3';
  contentBox.style.transform = 'translateY(10px)';

  setTimeout(() => {
    document.getElementById('about-title').innerText = data.title;
    document.getElementById('about-subtitle').innerText = data.subtitle;
    document.getElementById('about-desc').innerHTML = data.desc;
    mainImg.src = data.img;
    mainImg.style.opacity = '1';
    contentBox.style.opacity = '1';
    contentBox.style.transform = 'translateY(0)';
    void contentBox.offsetWidth;
    contentBox.classList.add('animating');
  }, 300);
  startAboutAutoPlay();
}

(function handleDailyTasks() {
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const taskStats = document.getElementById('task-stats');
  const clearTasksBtn = document.getElementById('clearTasksBtn');
  if (!taskInput || !addTaskBtn || !taskList) return;

  let tasks = [];
  try {
    const saved = localStorage.getItem('aayush_daily_tasks');
    if (saved) {
      tasks = JSON.parse(saved);
      if (!Array.isArray(tasks)) tasks = [];
    }
  } catch (e) {
    console.error("Failed to parse daily tasks", e);
    tasks = [];
  }
  const now = Date.now();
  tasks = tasks.filter(task => now - task.timestamp < 86400000);

  function saveTasks() {
    localStorage.setItem('aayush_daily_tasks', JSON.stringify(tasks));
    renderTasks();
  }

  function renderTasks() {
    taskList.innerHTML = '';
    let remaining = 0;
    tasks.forEach((task, index) => {
      if (!task.completed) remaining++;
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <div class="task-checkbox" onclick="toggleTask(${index})"><i class="ph ph-check"></i></div>
        <span>${task.text}</span>
        <i class="ph ph-trash delete-task" onclick="deleteTask(${index})"></i>
      `;
      taskList.appendChild(li);
    });
    if (taskStats) taskStats.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
  }

  window.toggleTask = (index) => {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
  };
  window.deleteTask = (index) => {
    tasks.splice(index, 1);
    saveTasks();
  };
  function addTask() {
    const text = taskInput.value.trim();
    if (text) {
      tasks.push({ text, completed: false, timestamp: Date.now() });
      taskInput.value = '';
      saveTasks();
    }
  }
  addTaskBtn.addEventListener('click', (e) => { e.preventDefault(); addTask(); });
  taskInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  });
  if (clearTasksBtn) {
    clearTasksBtn.addEventListener('click', () => {
      if (confirm('Clear all tasks?')) {
        tasks = [];
        saveTasks();
      }
    });
  }
  renderTasks();
})();

(function handleFooterWidget() {
  const calMonthYear = document.getElementById('cal-month-year');
  const calGrid = document.getElementById('cal-grid');
  const hourHand = document.getElementById('hour-hand');
  const minHand = document.getElementById('min-hand');
  const secHand = document.getElementById('sec-hand');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  if (!calMonthYear || !calGrid || !hourHand || !minHand || !secHand) return;

  let currentDisplayDate = new Date();

  function updateFooterWidget() {
    const now = new Date();
    const secDeg = (now.getSeconds() / 60) * 360;
    const minDeg = (now.getMinutes() / 60) * 360 + (now.getSeconds() / 60) * 6;
    const hourDeg = (now.getHours() / 12) * 360 + (now.getMinutes() / 60) * 30;
    secHand.style.transform = `rotate(${secDeg}deg)`;
    minHand.style.transform = `rotate(${minDeg}deg)`;
    hourHand.style.transform = `rotate(${hourDeg}deg)`;
  }

  function renderCalendar() {
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    calGrid.innerHTML = '';

    for (let i = firstDay; i > 0; i--) {
      const daySpan = document.createElement('span');
      daySpan.textContent = prevMonthLastDay - i + 1;
      daySpan.classList.add('other-month');
      calGrid.appendChild(daySpan);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const daySpan = document.createElement('span');
      daySpan.textContent = day;
      if (isCurrentMonth && day === today) daySpan.classList.add('today');
      calGrid.appendChild(daySpan);
    }

    const totalSlots = 35;
    let remainingSlots = totalSlots - calGrid.children.length;
    if (remainingSlots < 0) remainingSlots = 42 - calGrid.children.length;

    for (let i = 1; i <= remainingSlots; i++) {
      const daySpan = document.createElement('span');
      daySpan.textContent = i;
      daySpan.classList.add('other-month');
      calGrid.appendChild(daySpan);
    }
  }

  if (prevMonthBtn) {
    prevMonthBtn.onclick = (e) => {
      e.stopPropagation();
      currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
      renderCalendar();
    };
  }

  if (nextMonthBtn) {
    nextMonthBtn.onclick = (e) => {
      e.stopPropagation();
      currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
      renderCalendar();
    };
  }

  setInterval(updateFooterWidget, 1000);
  updateFooterWidget();
  renderCalendar();
})();

(function handleQuoteRotation() {
  const quoteText = document.getElementById('daily-quote-text');
  const quoteAuthor = document.getElementById('daily-quote-author');
  if (!quoteText || !quoteAuthor) return;

  const quotes = [
    { text: '"I\'ll take a potato chip… AND EAT IT!"', author: "— Light Yagami (Death Note)" },
    { text: '"If the pain doesn\'t kill me, it will only make me stronger."', author: "— Sung Jin Woo (Solo Leveling)" },
    { text: '"Whatever you lose, you\'ll find it again. But what you throw away you\'ll never get back."', author: "— Kenshin Himura" },
    { text: '"The only way to truly escape the mundane is for you to constantly be evolving."', author: "— Izaya Orihara" }
  ];

  let currentIndex = Math.floor(Math.random() * quotes.length);

  // Set initial random quote on load
  quoteText.textContent = quotes[currentIndex].text;
  quoteAuthor.textContent = quotes[currentIndex].author;

  let quoteInterval;

  function rotateQuote() {
    quoteText.style.opacity = 0;
    quoteAuthor.style.opacity = 0;
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % quotes.length;
      quoteText.textContent = quotes[currentIndex].text;
      quoteAuthor.textContent = quotes[currentIndex].author;
      quoteText.style.opacity = 1;
      quoteAuthor.style.opacity = 1;
    }, 500);
  }

  function startRotation() {
    if (quoteInterval) clearInterval(quoteInterval);
    quoteInterval = setInterval(rotateQuote, 600000);
  }

  quoteText.style.transition = 'opacity 0.5s ease';
  quoteAuthor.style.transition = 'opacity 0.5s ease';

  const quoteBox = document.querySelector('.quote-box');
  if (quoteBox) {
    quoteBox.style.cursor = 'pointer';
    quoteBox.addEventListener('click', () => {
      rotateQuote();
      startRotation();
    });
  }
  startRotation();
})();

// AI Pet logic moved to pet.js

(function handleVisitorCounter() {
  const visitorCountEl = document.getElementById('visitor-count');
  if (!visitorCountEl) return;

  // Using counterapi.dev for a real global visitor count
  const namespace = "aayushpanche-portfolio-v2";
  const key = "visits";
  const upUrl = `https://api.counterapi.dev/v1/${namespace}/${key}/up`;
  const getUrl = `https://api.counterapi.dev/v1/${namespace}/${key}/`;

  async function updateVisitorCount() {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const hasVisited = localStorage.getItem('aayush_has_visited');
      const targetUrl = hasVisited ? getUrl : upUrl;

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Counter service unreachable");

      const data = await response.json();
      if (data && typeof data.count === 'number') {
        if (!hasVisited) localStorage.setItem('aayush_has_visited', 'true');

        const count = data.count + 10;
        visitorCountEl.innerHTML = `You are the <strong style="color: #bf55ff;">${count.toLocaleString()}${getOrdinalSuffix(count)}</strong> visitor`;
      }
    } catch (error) {
      console.error("Visitor Counter Error:", error);
      let localCount = parseInt(localStorage.getItem('aayush_local_visits_v2') || "10");

      // Only increment local count if they haven't visited before
      if (!localStorage.getItem('aayush_has_visited')) {
        localCount++;
        localStorage.setItem('aayush_local_visits_v2', localCount.toString());
        localStorage.setItem('aayush_has_visited', 'true');
      }

      visitorCountEl.innerHTML = `You are the <strong style="color: #bf55ff;">${localCount.toLocaleString()}${getOrdinalSuffix(localCount)}</strong> visitor`;
    }
  }

  function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  }

  updateVisitorCount();
})();

// --- DYNAMIC LATEST BLOGS POPULATING LOGIC FROM OBSIDIAN ---
(async function initLatestBlogs() {
  const blogListContainer = document.getElementById('latest-blog-list');
  if (!blogListContainer) return;

  const GITHUB_USERNAME = 'aayushpancheofficial';
  const REPO_NAME = 'obsidian';
  let GITHUB_TOKEN = '';

  // Dynamically sync token from localStorage (if set in blogs.js)
  const storedToken = localStorage.getItem('GITHUB_PERSONAL_ACCESS_TOKEN');
  if (storedToken && storedToken.startsWith('github_pat_')) {
    GITHUB_TOKEN = storedToken;
  }

  function getAuthHeader() {
    return (GITHUB_TOKEN && GITHUB_TOKEN.startsWith('github_pat_'))
      ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      : {};
  }

  try {
    const treeUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/git/trees/main?recursive=1&t=${Date.now()}`;
    let response = await fetch(treeUrl, { headers: getAuthHeader(), cache: 'no-store' });

    // If unauthorized, retry unauthenticated (for public repos fallback)
    if (response.status === 401 && GITHUB_TOKEN) {
      response = await fetch(treeUrl, { cache: 'no-store' });
    }

    if (!response.ok) throw new Error(`Failed to fetch tree: ${response.status}`);
    const data = await response.json();

    const BLOG_BLOCKLIST = ['plane.md', 'plane'];

    const files = data.tree.filter(item => {
      const fileName = item.path.split('/').pop();
      if (BLOG_BLOCKLIST.includes(fileName)) return false;

      const isFile = item.type === 'blob';
      const isMarkdown = item.path.endsWith('.md');
      const hasNoExtension = !item.path.split('/').pop().includes('.');
      const isNotHidden = !item.path.split('/').pop().startsWith('.');
      const isSubNote = fileName.startsWith('_') || item.path.toLowerCase().includes('/internal/') || item.path.toLowerCase().includes('/subnotes/');

      return isFile && isNotHidden && (isMarkdown || hasNoExtension) && !isSubNote;
    });

    if (files.length === 0) {
      blogListContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center; grid-column: 1/-1;">No blogs found.</p>';
      return;
    }

    const processedBlogs = [];

    // Prioritize "About Aayush" blog
    let filesToFetch = [];
    const pinnedFileIndex = files.findIndex(f => f.path.toLowerCase().includes('about aayush'));
    if (pinnedFileIndex !== -1) {
      filesToFetch.push(files.splice(pinnedFileIndex, 1)[0]);
    }
    filesToFetch = filesToFetch.concat(files.slice(0, 5));

    // Fetch details for the selected notes
    const fetchPromises = filesToFetch.map(async (file) => {
      try {
        const encodedPath = encodeURI(file.path);

        // 1. Fetch updated date from commits API
        const commitUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/commits?path=${encodedPath}&page=1&per_page=1`;
        let commitRes = await fetch(commitUrl, { headers: getAuthHeader() });
        if (commitRes.status === 401 && GITHUB_TOKEN) {
          commitRes = await fetch(commitUrl);
        }

        let dateVal = new Date(0);
        let dateString = "Recent";
        if (commitRes.ok) {
          const commits = await commitRes.json();
          if (commits.length > 0) {
            dateVal = new Date(commits[0].commit.committer.date);
            dateString = dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }

        // 2. Fetch raw note content using Contents API with Accept: application/vnd.github.v3.raw
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${encodedPath}?t=${Date.now()}`;
        const requestHeaders = {
          ...getAuthHeader(),
          'Accept': 'application/vnd.github.v3.raw'
        };
        let contentRes = await fetch(apiUrl, { headers: requestHeaders, cache: 'no-store' });

        if (contentRes.status === 401 && GITHUB_TOKEN) {
          contentRes = await fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github.v3.raw' }, cache: 'no-store' });
        }

        let title = file.path.split('/').pop().replace('.md', '').replace(/_/g, ' ');
        let excerpt = "Read my latest notes and updates.";

        if (contentRes.ok) {
          const mdText = await contentRes.text();
          let cleanText = mdText;
          if (mdText.trim().startsWith('---')) {
            const parts = mdText.split('---');
            if (parts.length >= 3) cleanText = parts.slice(2).join('---').trim();
          }
          const h1Match = cleanText.match(/^#\s+(.*)$/m);
          if (h1Match) title = h1Match[1].trim();

          const paragraphs = cleanText.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('!'));
          if (paragraphs.length > 0) {
            excerpt = paragraphs[0].substring(0, 95) + '...';
          }
        }

        processedBlogs.push({
          title,
          dateVal,
          dateString,
          excerpt,
          fileName: file.path.split('/').pop()
        });
      } catch (e) {
        console.error(e);
      }
    });

    await Promise.all(fetchPromises);

    // Sort by commit date descending
    processedBlogs.sort((a, b) => b.dateVal - a.dateVal);

    // Take the 2 most recent blogs (exclude About Aayush if fetched dynamically)
    const dynamicBlogs = processedBlogs.filter(b => !b.fileName.toLowerCase().includes('about aayush')).slice(0, 1);

    const finalBlogs = [
      {
        title: "About Aayush",
        excerpt: "Hi, I'm Aayush, a passionate learner and full-stack web developer. Read more about my journey, skills, and goals.",
        dateString: "Pinned",
        fileName: "About Aayush.md",
        isPinned: true
      },
      ...dynamicBlogs
    ];

    blogListContainer.innerHTML = '';
    finalBlogs.forEach(blog => {
      const blogItem = document.createElement('div');
      blogItem.className = 'blog-item';
      if (blog.isPinned) {
        blogItem.style.border = '1px solid rgba(192, 132, 252, 0.3)';
        blogItem.style.position = 'relative';
      }
      blogItem.innerHTML = `
        ${blog.isPinned ? '<i class="ph-fill ph-push-pin" style="position: absolute; top: 15px; right: 15px; color: #c084fc; font-size: 1.2rem; transform: rotate(45deg);"></i>' : ''}
        <div class="blog-info">
          <h3 class="blog-post-title">${blog.title}</h3>
          <p class="blog-post-desc">${blog.excerpt}</p>
          <div class="blog-post-date"><i class="ph ph-calendar"></i> ${blog.dateString}</div>
        </div>
        <a href="blogs.html?post=${encodeURIComponent(blog.fileName)}" class="read-more">Read more <i class="ph ph-arrow-right"></i></a>
      `;
      blogListContainer.appendChild(blogItem);
    });

  } catch (err) {
    console.error("Failed to load dynamic latest blogs:", err);
    blogListContainer.innerHTML = `
      <div class="blog-item" style="border: 1px solid rgba(192, 132, 252, 0.3); position: relative;">
        <i class="ph-fill ph-push-pin" style="position: absolute; top: 15px; right: 15px; color: #c084fc; font-size: 1.2rem; transform: rotate(45deg);"></i>
        <div class="blog-info">
          <h3 class="blog-post-title">About Aayush</h3>
          <p class="blog-post-desc">Hi, I'm Aayush, a passionate learner and full-stack web developer. Read more about my journey, skills, and goals.</p>
          <div class="blog-post-date"><i class="ph ph-calendar"></i> Pinned</div>
        </div>
        <a href="blogs.html?post=About%20Aayush.md" class="read-more">Read more <i class="ph ph-arrow-right"></i></a>
      </div>
      <p style="color: rgba(255,255,255,0.4); text-align: center; grid-column: 1/-1; margin-top: 10px;">
        Unable to load recent blogs.
      </p>
    `;
  }
})();

(function initHologramCode() {
  const container = document.getElementById('hologram-text');
  if (!container) return;

  const codeSnippet = `
<span style='color: rgba(255,255,255,0.5)'>/* --- Glassmorphism UI --- */</span>
<span style='color: #e2cb65'>.hero-container</span> <span style='color: #fff'>{ backdrop-filter: blur(2px); border-radius: 40px; z-index: 10; }</span>
<span style='color: #e2cb65'>.glass-navbar</span> <span style='color: #fff'>{ background: var(--theme-bg-glass); backdrop-filter: blur(20px) saturate(180%); }</span>
<span style='color: #e2cb65'>.avatar-wrapper</span> <span style='color: #fff'>{ border: 4px solid var(--theme-border); box-shadow: 0 0 30px var(--theme-glow); }</span>
<span style='color: #c084fc'>@keyframes float</span> <span style='color: #fff'>{ 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }</span>
<span style='color: #e2cb65'>.bento-glass</span> <span style='color: #fff'>{ background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); }</span>
<span style='color: #e2cb65'>.glow-beam</span> <span style='color: #fff'>{ box-shadow: 0 0 30px var(--theme-glow); animation: lamp-glow 1.5s infinite; }</span>
<span style='color: #e2cb65'>.theme-dropdown</span> <span style='color: #fff'>{ backdrop-filter: blur(24px); border-radius: 20px; z-index: 200; }</span>

<span style='color: rgba(255,255,255,0.5)'>/* --- System Logic --- */</span>
<span style='color: #c084fc'>async function</span> <span style='color: #38bdf8'>fetchSpotifyTracks()</span> <span style='color: #fff'>{ const response = await fetch(url); }</span>
<span style='color: #c084fc'>function</span> <span style='color: #38bdf8'>applyTheme(themeName)</span> <span style='color: #fff'>{ bodyEl.classList.add(themeName); }</span>
<span style='color: #c084fc'>function</span> <span style='color: #38bdf8'>initRain()</span> <span style='color: #fff'>{ ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x, drop.y + drop.length); }</span>
<span style='color: #c084fc'>function</span> <span style='color: #38bdf8'>handleDailyTasks()</span> <span style='color: #fff'>{ const taskInput = document.getElementById('taskInput'); }</span>
<span style='color: #c084fc'>function</span> <span style='color: #38bdf8'>changeAboutContent(key)</span> <span style='color: #fff'>{ mainImg.style.opacity = '1'; }</span>
<span style='color: #c084fc'>const</span> <span style='color: #fff'>observer = new IntersectionObserver((entries) => {</span>
<span style='color: #fff'>  entries.forEach(entry => { if(entry.isIntersecting) { ... } });</span>
<span style='color: #fff'>});</span>
`;

  const scroller = document.createElement('div');
  scroller.className = 'code-scroll-content';
  scroller.innerHTML = codeSnippet.repeat(15);

  container.innerHTML = '';
  container.appendChild(scroller);
})();


(function initStickyBoard() {
  const stickyContent = document.getElementById('sticky-board-content');
  if (!stickyContent) return;

  const GITHUB_USERNAME = 'aayushpancheofficial';
  const REPO_NAME = 'obsidian';
  const FILE_PATH = 'board.md'; // User should create this file

  async function fetchStickyNote() {
    try {
      const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}?t=${Date.now()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("File not found");
      }

      const text = await res.text();

      // Basic markdown parsing
      let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' style='max-width:100%;border-radius:4px;'/>")
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank'>$1</a>")
        .replace(/\n$/gim, '<br />');

      // Simple list parsing
      html = html.replace(/^\s*-\s(.*)/gim, '<ul><li>$1</li></ul>');
      html = html.replace(/<\/ul>\n<ul>/gim, '');

      // Use marked.js if available
      if (typeof marked !== 'undefined') {
        html = marked.parse(text);
      }

      stickyContent.innerHTML = html;

    } catch (err) {
      stickyContent.innerHTML = `
        <div style="opacity: 0.6; text-align: center; padding-top: 20px;">
          <p>Note not found.</p>
          <p style="font-size: 0.8rem; margin-top: 10px;">Create a file named <b>board.md</b> in your obsidian repo main folder.</p>
        </div>
      `;
    }
  }

  fetchStickyNote();
})();

// Contact Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  const openContactBtns = document.querySelectorAll('#open-contact-btn, #hero-contact-btn');
  const closeContactBtn = document.getElementById('close-contact-modal');
  const contactModal = document.getElementById('contact-modal');
  const contactForm = document.getElementById('contact-form');

  if (!contactModal) return;

  function closeModal() {
    contactModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  openContactBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      contactModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  closeContactBtn.addEventListener('click', closeModal);

  contactModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('contact-modal-overlay')) {
      closeModal();
    }
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('.submit-msg-btn');
      const originalText = btn.innerHTML;

      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value;

      btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sending...';

      try {
        const response = await fetch("https://formsubmit.co/ajax/aayushpanche135@gmail.com", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: subject || `New Contact from ${name}`,
            Name: name,
            Email: email,
            Message: message
          })
        });

        if (response.ok) {
          btn.innerHTML = '<i class="ph ph-check-circle"></i> Sent Successfully';
          btn.style.background = '#22c55e';
          btn.style.color = '#fff';

          setTimeout(() => {
            closeModal();
            contactForm.reset();
            setTimeout(() => {
              btn.innerHTML = originalText;
              btn.style.background = '';
              btn.style.color = '';
            }, 500);
          }, 2000);
        } else {
          throw new Error('Failed to send');
        }
      } catch (error) {
        btn.innerHTML = '<i class="ph ph-warning"></i> Error. Try again.';
        btn.style.background = '#ef4444';
        btn.style.color = '#fff';

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 3000);
      }
    });
  }
});

// --- Study Timer Logic ---
(function initStudyTimer() {
  const timeDisplay = document.getElementById('timer-time');
  const playPauseBtn = document.getElementById('timer-play-pause');
  const resetBtn = document.getElementById('timer-reset');
  const iconPlay = document.getElementById('timer-icon-play');
  const progressBorder = document.getElementById('timer-progress-border');
  const centerTouch = document.getElementById('timer-center-touch');
  const endTimeDisplay = document.getElementById('timer-end-time');

  if (!timeDisplay || !playPauseBtn || !resetBtn) return;

  let timerInterval = null;
  let defaultMinutes = 25;
  let totalSeconds = defaultMinutes * 60;
  let remainingSeconds = totalSeconds;
  let isRunning = false;

  function updateDisplay() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    timeDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Update progress border
    const progress = 100 - ((remainingSeconds / totalSeconds) * 100);
    progressBorder.style.setProperty('--progress', `${progress}%`);

    if (remainingSeconds === 0) {
      clearInterval(timerInterval);
      isRunning = false;
      iconPlay.className = 'ph-fill ph-play';
      endTimeDisplay.textContent = '--:--';
      
      // Play alarm sound
      const alarmSound = new Audio("https://www.soundjay.com/clock/sounds/alarm-clock-elapsed-01.mp3");
      alarmSound.play().catch(e => console.log("Audio play failed:", e));
      
      // Basic completion alert
      setTimeout(() => alert("Time's up! Great study session! 🎯"), 100);
    }
  }

  function toggleTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      iconPlay.className = 'ph-fill ph-play';
      endTimeDisplay.textContent = '--:--';
    } else {
      if (remainingSeconds === 0) {
        remainingSeconds = totalSeconds; // auto reset if started at 0
      }
      timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
      }, 1000);
      isRunning = true;
      iconPlay.className = 'ph-fill ph-pause';

      // Calculate end time
      const endTime = new Date(Date.now() + remainingSeconds * 1000);
      const h = endTime.getHours().toString().padStart(2, '0');
      const m = endTime.getMinutes().toString().padStart(2, '0');
      endTimeDisplay.textContent = `${h}:${m}`;
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    iconPlay.className = 'ph-fill ph-play';
    remainingSeconds = totalSeconds;
    endTimeDisplay.textContent = '--:--';
    updateDisplay();
  }

  playPauseBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  centerTouch.addEventListener('click', () => {
    if (isRunning) return; // Don't change while running
    const minStr = prompt("Set study timer in minutes (1-120):", (totalSeconds / 60).toString());
    if (minStr !== null) {
      const mins = parseInt(minStr);
      if (!isNaN(mins) && mins > 0 && mins <= 120) {
        defaultMinutes = mins;
        totalSeconds = defaultMinutes * 60;
        resetTimer();
      } else {
        alert("Please enter a valid number between 1 and 120.");
      }
    }
  });

  updateDisplay();
})();
