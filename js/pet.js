// --- Sprite AI Pet Logic (Global) ---
(function initSpritePet() {
  const container = document.getElementById('ai-pet-main-container');
  const sprite = document.getElementById('ai-pet');
  const spriteInner = document.getElementById('ai-pet-sprite');
  const speech = document.getElementById('ai-pet-speech');
  if (!container || !sprite || !spriteInner || !speech) return;

  // Ensure the speech bubble never blocks click/drag events on the pet avatar
  speech.style.pointerEvents = 'none';

  // Add mobile CSS to prevent the pet from blocking scrolling on touch devices
  const mobileStyles = document.createElement('style');
  mobileStyles.innerHTML = `
    @media (max-width: 768px) {
      #ai-pet-main-container, #ai-pet {
        pointer-events: none !important;
      }
    }
  `;
  document.head.appendChild(mobileStyles);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  // Set initial pet image
  sprite.classList.add('idle');

  let targetOffsetX = 0;
  let targetOffsetY = 0;
  let faceX = 1;
  let lastMoveTime = Date.now();
  let isSleeping = false;
  let isEating = false;
  let idleTimer = 0;
  let isBehaviorMode = false;

  // --- Interactive Drag & Drop State ---
  let isDragging = false;
  let isAnchored = false;
  let isTrackingMouse = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let containerStartX = 0;
  let containerStartY = 0;
  let dragMoveDistance = 0;



  // Change offset every few seconds to "wander" around cursor
  setInterval(() => {
    if (!isSleeping && !isEating) {
      targetOffsetX = (Math.random() - 0.5) * 80; // -40 to 40
      targetOffsetY = (Math.random() - 0.5) * 60; // -30 to 30

      // On mobile screens, simulate random cursor movements to wander automatically
      if (window.innerWidth <= 768 && !isAnchored) {
        mouseX = window.innerWidth / 2 + (Math.random() - 0.5) * (window.innerWidth - 100);
        mouseY = window.innerHeight / 2 + (Math.random() - 0.5) * (window.innerHeight - 100);
        lastMoveTime = Date.now(); // Keep awake while wandering
      }
    }
  }, 3000);

  function handleMove(clientX, clientY) {
    if (!isDragging && !isAnchored) {
      mouseX = clientX;
      mouseY = clientY;
    }
    lastMoveTime = Date.now();
    if (isSleeping) {
      isSleeping = false;
    }

    if (isDragging) {
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      dragMoveDistance = Math.sqrt(dx * dx + dy * dy);

      currentX = containerStartX + dx;
      currentY = containerStartY + dy;

      // Face the correct direction during drag movement
      if (dx > 0) {
        faceX = -1;
      } else if (dx < 0) {
        faceX = 1;
      }
    }
  }

  document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  const speed = 1.2;
  let speechTimeout;

  function showMessage(msg, duration = 3000) {
    speech.innerText = msg;
    speech.classList.add('show');
    clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      speech.classList.remove('show');
    }, duration);
  }

  // Periodic Eating
  setInterval(() => {
    if (!sprite.classList.contains('walking') && !isSleeping && Math.random() > 0.6) {
      isEating = true;
      showMessage("Nom ... 🍜", 5000);
      setTimeout(() => {
        isEating = false;
      }, 5000);
    }
  }, 120000);

  // Idle Thoughts & Sleep Check
  const messages = ["Exploring!", "Nice work!", "Cool site!", "I see you!", "Aayush is the best!", "Steady walking..."];
  setInterval(() => {
    const idleTime = Date.now() - lastMoveTime;
    if (idleTime > 20000 && !isSleeping) {
      isSleeping = true;
      showMessage("Zzz... 😴", 10000);
    } else if (!sprite.classList.contains('walking') && !isSleeping && !isEating) {
      if (Math.random() > 0.7) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        showMessage(msg);
      }
    }
  }, 5000);

  function handleDown(isPetClick, clientX, clientY, e) {
    if (isSleeping) {
      isSleeping = false;
      showMessage("Whoa! You woke me up!");
    }
    if (isPetClick) {
      if (e && e.stopPropagation) e.stopPropagation();
      isDragging = true;
      isSleeping = false;
      dragMoveDistance = 0;
      sprite.classList.add('walking');

      dragStartX = clientX;
      dragStartY = clientY;
      containerStartX = currentX;
      containerStartY = currentY;

      showMessage("Wheee! Carrying me! 🎈", 1500);
    } else {
      if (!isDragging) {
        sprite.style.transition = "margin-top 0.2s ease";
        sprite.style.marginTop = "-20px";
        setTimeout(() => sprite.style.marginTop = "0px", 200);
      }
    }
  }

  document.addEventListener('mousedown', (e) => handleDown(false, e.clientX, e.clientY, e));
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) handleDown(false, e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: true });

  // Sprite Grab & Carry
  sprite.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left click drags
    handleDown(true, e.clientX, e.clientY, e);
  });
  sprite.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) handleDown(true, e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: true });

  // Sprite Release & Logic Anchor/Resume
  function handleUp() {
    if (isDragging) {
      isDragging = false;
      sprite.classList.remove('walking');

      // If it was just a quick static click (moved less than 6 pixels), toggle Follow/Stay!
      if (dragMoveDistance < 6) {
        isAnchored = !isAnchored;
        if (isAnchored) {
          mouseX = currentX;
          mouseY = currentY;
          showMessage("Staying here! 📍", 2000);
        } else {
          isSleeping = false;
          showMessage("Walking with you! 🐾", 2000);
        }
      } else {
        // It was a drag and drop, so anchor it at the dropped position!
        isAnchored = true;
        mouseX = currentX;
        mouseY = currentY;
        showMessage("Dropped here! 📍 (Click me to walk)", 3000);
      }
    }
  }

  document.addEventListener('mouseup', handleUp);
  document.addEventListener('touchend', handleUp);



  function animatePet() {
    // If user is actively dragging the pet, immediately lock position to mouse drag delta
    if (isDragging) {
      container.style.transform = `translate(${currentX - 19.2}px, ${currentY - 48}px)`;
      sprite.style.transform = `scaleX(${faceX})`;

      // Ensure sprite animation displays walking frames while carrying
      sprite.classList.add('walking');
      sprite.classList.remove('idle');
      sprite.classList.remove('behavior');
      spriteInner.style.backgroundPositionY = '-51.2px';

      requestAnimationFrame(animatePet);
      return;
    }

    // Determine target location based on state
    const targetX = mouseX + targetOffsetX;
    const targetY = mouseY + targetOffsetY;

    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);



    // Hysteresis deadzone logic
    if (distance > 80) {
      isTrackingMouse = true;
    } else if (distance <= 5) {
      isTrackingMouse = false;
    }

    if (isTrackingMouse) {
      idleTimer = 0;
      isBehaviorMode = false;
      sprite.classList.add('walking');
      sprite.classList.remove('idle');
      sprite.classList.remove('behavior');
      if (Math.abs(dx) > Math.abs(dy) * 0.5) {
        if (dx > 0) {
          spriteInner.style.backgroundPositionY = '-51.2px';
          faceX = -1;
        } else {
          spriteInner.style.backgroundPositionY = '-51.2px';
          faceX = 1;
        }
      } else if (dy < 0) {
        spriteInner.style.backgroundPositionY = '-102.4px';
        faceX = 1;
      } else {
        spriteInner.style.backgroundPositionY = '0px';
        faceX = 1;
      }
      const vx = (dx / distance) * speed;
      const vy = (dy / distance) * speed;
      currentX += vx;
      currentY += vy;
    } else {
      sprite.classList.remove('walking');
      if (!isBehaviorMode) {
        if (idleTimer === 0) {
          idleTimer = Date.now();
          sprite.classList.add('idle');
          spriteInner.style.backgroundPosition = '0px 0px';
        } else if (Date.now() - idleTimer >= 6000) {
          isBehaviorMode = true;
          sprite.classList.remove('idle');
          sprite.classList.add('behavior');
          // Always use the first image (typing on laptop)
          spriteInner.style.backgroundPosition = `0px 0px`;
        }
      }
    }
    sprite.style.transform = `scaleX(${faceX})`;

    // Position container so feet are AT the cursor tip
    container.style.transform = `translate(${currentX - 19.2}px, ${currentY - 48}px)`;

    requestAnimationFrame(animatePet);
  }
  animatePet();
})();

// --- Global Quotes Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const quotesList = [
    { text: `"I'll take a potato chip… AND EAT IT!"`, author: "— Light Yagami (Death Note)" },
    { text: `"Never give up without ever trying, do what you can, no matter how small the effect it may have!"`, author: "— Naruto Uzumaki" },
    { text: `"People's lives don't end when they die, it ends when they lose faith."`, author: "— Itachi Uchiha" },
    { text: `"A place where someone still thinks about you is a place you can call home."`, author: "— Jiraiya" },
    { text: `"नियतं कुरु कर्म त्वं।<br>Perform your duty without hesitation—it leads to fulfillment."`, author: "— Bhagavad Gita" },
    { text: `"No one knows what the outcome of your decision will be. So, choose whatever, you'll regret the least."`, author: "— Levi Ackerman" }
  ];

  const quoteText = document.getElementById('daily-quote-text');
  const quoteAuthor = document.getElementById('daily-quote-author');
  const quoteBox = document.querySelector('.quote-box');
  
  function setRandomQuote() {
    if (quoteText && quoteAuthor) {
      const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
      quoteText.innerHTML = randomQuote.text;
      quoteAuthor.innerText = randomQuote.author;
    }
  }

  // Set initial quote
  setRandomQuote();

  // Change quote on click
  if (quoteBox) {
    quoteBox.style.cursor = 'pointer';
    quoteBox.title = 'Click for another quote!';
    quoteBox.addEventListener('click', () => {
      // Small click animation
      quoteBox.style.transform = 'scale(0.98)';
      setTimeout(() => {
        quoteBox.style.transform = '';
      }, 150);
      setRandomQuote();
    });
  }
});
