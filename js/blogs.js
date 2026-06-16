document.addEventListener("DOMContentLoaded", () => {
  let modalSessionDepth = 0;

  // Set up the initial history state for the base blogs page (depth 0)
  if (!window.location.search.includes('post=')) {
    window.history.replaceState({ post: null, depth: 0 }, '', window.location.href);
  } else {
    // We loaded the page with a target post, replace current entry with base (depth 0)
    // and then push the target post entry (depth 1) so Back button closes the modal.
    const urlParams = new URLSearchParams(window.location.search);
    const targetPost = urlParams.get('post');
    
    const baseUrl = new URL(window.location);
    baseUrl.searchParams.delete('post');
    window.history.replaceState({ post: null, depth: 0 }, '', baseUrl);

    const postUrl = new URL(window.location);
    postUrl.searchParams.set('post', targetPost);
    window.history.pushState({ post: targetPost, depth: 1 }, '', postUrl);
    modalSessionDepth = 1;
  }

  const scene = document.getElementById("parallax-scene");
  const layers = document.querySelectorAll(".parallax-layer");

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  document.addEventListener("mousemove", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    targetX = (x - centerX) / centerX;
    targetY = (y - centerY) / centerY;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  document.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  function animate() {
    if (window.innerWidth <= 768) return requestAnimationFrame(animate); // Disable parallax on mobile

    const ease = 0.08;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    layers.forEach(layer => {
      const depth = parseFloat(layer.getAttribute("data-depth"));
      const mouseTranslateX = currentX * depth * -120;
      const mouseTranslateY = currentY * depth * -60;
      const scrollTranslateY = scrollY * (1 - depth) * 0.85;
      const finalY = mouseTranslateY + scrollTranslateY;
      layer.style.transform = `translate3d(${mouseTranslateX}px, ${finalY}px, 0)`;
    });

    const runningTextParent = document.querySelector('.running-text-layer');
    if (runningTextParent) {
      runningTextParent.style.transform = `translateX(-${scrollY * 0.5}px)`;
    }
    requestAnimationFrame(animate);
  }
  animate();

  // --- Reusable GSAP Magnetic Button Effect ---
  function makeElementMagnetic(element, strength = 0.3) {
    // GSAP Magnetic Effect Removed
  }

  const categoryPills = document.querySelectorAll('.category-pill');
  const blogGrid = document.getElementById('blogGrid');

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-filter');
      const cards = document.querySelectorAll('.blog-card');

      const visibleCards = [];
      cards.forEach(card => {
        const categories = card.getAttribute('data-category') || "";
        if (filter === 'All' || categories.includes(filter)) {
          card.style.display = 'block';
          visibleCards.push(card);
        } else {
          card.style.display = 'none';
        }
      });

      // Reset style properties directly without GSAP
      visibleCards.forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
    });
  });

  const revealElements = document.querySelectorAll('.reveal-up');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
  revealElements.forEach(el => revealObserver.observe(el));

  function setupCardInteractions(card, title, date, content, fileName) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openBlogModal(title, date, content, fileName);
    });
  }

  const GITHUB_USERNAME = 'aayushpancheofficial';
  const REPO_NAME = 'obsidian';
  let GITHUB_TOKEN = '';
  if (GITHUB_TOKEN && GITHUB_TOKEN.startsWith('github_pat_')) {
    localStorage.setItem('GITHUB_PERSONAL_ACCESS_TOKEN', GITHUB_TOKEN);
  }

  function getAuthHeader() {
    if (!GITHUB_TOKEN) return {};
    return GITHUB_TOKEN.startsWith('github_pat_')
      ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      : { 'Authorization': `token ${GITHUB_TOKEN}` };
  }

  const blogModal = document.getElementById('blogModal');
  const closeModal = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  const modalBody = document.getElementById('modalBody');

  // Prevent modal scroll/touch events from bubbling up to Lenis smooth scroll
  blogModal.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  blogModal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  const assetMap = {};

  const CACHE_KEY = 'github_blog_tree_v2';
  const CACHE_TIME_KEY = 'github_blog_tree_time_v2';
  const CACHE_DURATION = 5 * 60 * 1000; // 5-minute high performance cache

  async function fetchGitHubBlogs() {
    try {
      let data = null;
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      // Check if we have a valid cache
      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        data = JSON.parse(cachedData);
        console.log("Blogs loaded directly from high-performance cache!");
      } else {
        const treeUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/git/trees/main?recursive=1&t=${now}`;
        let response = await fetch(treeUrl, { headers: getAuthHeader(), cache: 'no-store' });

        // If the token is invalid (401), retry unauthenticated (for public repos)
        if (response.status === 401 && GITHUB_TOKEN) {
          console.warn("GitHub Token returned 401 Unauthorized. Retrying unauthenticated...");
          response = await fetch(treeUrl, { cache: 'no-store' });
        }

        if (!response.ok) {
          if (cachedData) {
            console.warn("Gracefully falling back to cached blog data...");
            data = JSON.parse(cachedData);
          } else {
            throw new Error(`GitHub API Error: ${response.status} (${response.statusText || 'Unauthorized, Forbidden, or Rate Limited'})`);
          }
        } else {
          data = await response.json();
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
        }
      }

      // Populate global assetMap
      data.tree.forEach(item => {
        const fileName = item.path.split('/').pop();
        assetMap[fileName] = item.path;
      });

      const BLOG_BLOCKLIST = ['plane.md', 'plane', 'board.md', 'board']; // Add filenames to hide them

      const files = data.tree.filter(item => {
        const fileName = item.path.split('/').pop();
        if (BLOG_BLOCKLIST.includes(fileName)) return false;

        const isFile = item.type === 'blob';
        const isMarkdown = item.path.endsWith('.md');
        const hasNoExtension = !item.path.split('/').pop().includes('.');
        const isNotHidden = !item.path.split('/').some(part => part.startsWith('.'));
        return isFile && isNotHidden && (isMarkdown || hasNoExtension);
      });

      // Pin "About Aayush" to the top
      const pinnedFileIndex = files.findIndex(f => f.path.toLowerCase().includes('about aayush'));
      if (pinnedFileIndex !== -1) {
        const pinnedFile = files.splice(pinnedFileIndex, 1)[0];
        files.unshift(pinnedFile);
      }

      let loadedCardsCount = 0;

      // Fetch markdown content
      for (const file of files) {
        try {
          const encodedPath = encodeURI(file.path);
          let mdText = null;

          // 1. Try fetching with token (supports private repositories perfectly)
          if (GITHUB_TOKEN) {
            const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${encodedPath}`;
            const contentRes = await fetch(apiUrl, {
              headers: {
                ...getAuthHeader(),
                'Accept': 'application/vnd.github.v3.raw'
              },
              cache: 'no-store'
            });
            if (contentRes.ok) {
              mdText = await contentRes.text();
            }
          }

          // 2. Fallback to unauthenticated raw.githubusercontent.com (for public repositories)
          if (!mdText) {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodedPath}?t=${Date.now()}`;
            const contentRes = await fetch(rawUrl, { cache: 'no-store' });
            if (contentRes.ok) {
              mdText = await contentRes.text();
            }
          }

          if (mdText) {
            processMarkdown(file.path.split('/').pop(), mdText, file.path, assetMap, "Recent");
            loadedCardsCount++;
          }
        } catch (fileErr) {
          console.error("Error loading blog file:", file.path, fileErr);
        }
      }

      if (loadedCardsCount === 0) {
        throw new Error("No blog notes could be successfully loaded. Check if the repository is private and requires a working GITHUB_TOKEN.");
      }

      // Show cards directly without GSAP animation
      const cards = document.querySelectorAll('.blog-card');
      cards.forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
    } catch (err) {
      console.error(err);
      blogGrid.innerHTML = `
        <div class="error-msg" style="grid-column: 1 / -1; background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.2); color: #ff4757; padding: 30px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px);">
          <i class="ph ph-warning-circle" style="font-size: 2.5rem; display: block; margin-bottom: 10px; color: #ff4757;"></i>
          <h3 style="color: #ff4757; font-size: 1.3rem; margin-bottom: 8px;">Unable to load blogs</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 15px;">${err.message}</p>
          <span style="font-size: 0.85rem; display: block; line-height: 1.5; color: #a0a8b8; max-width: 600px; margin: 0 auto;">
            This is usually because the GITHUB_TOKEN is expired, revoked, or invalid, or the GitHub API rate limit has been reached.
            <br><br>
            <strong>How to fix:</strong>
            <br>
            1. Go to your GitHub Settings -> Developer settings -> Personal access tokens (Fine-grained).
            <br>
            2. Generate a new token and update it in <code>let GITHUB_TOKEN</code> inside <code>js/blogs.js</code>.
          </span>
        </div>
      `;
    }
  }

  function processMarkdown(fileName, mdText, filePath, assetMap, githubDate) {
    let cleanText = mdText;
    if (mdText.trim().startsWith('---')) {
      const parts = mdText.split('---');
      if (parts.length >= 3) cleanText = parts.slice(2).join('---').trim();
    }
    cleanText = cleanText.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, assetName, alt) => {
      const cleanAssetName = assetName.split('/').pop();
      const path = assetMap[cleanAssetName] || assetName;
      const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodeURI(path)}?t=${Date.now()}`;
      return `![${alt || assetName}](${url})`;
    });
    // Do not replace [[...]] here, pass raw markdown to modal to prevent code block escaping.

    let title = fileName.replace('.md', '').replace(/_/g, ' ');
    const h1Match = cleanText.match(/^#\s+(.*)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      cleanText = cleanText.replace(h1Match[0], '').trim();
    }

    let date = githubDate || "Recent";
    const dateMatch = mdText.match(/date:\s*["']?(.*?)["']?$/im) || mdText.match(/Date:\s*(.*)/);
    if (dateMatch) date = dateMatch[1].trim();

    let excerptText = cleanText.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1').replace(/==([^=]+)==/g, '$1');
    const excerpt = excerptText.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 1).join(' ').substring(0, 60) + '...';
    let category = filePath.toLowerCase().includes('notes') ? "Notes" : (filePath.includes('/') ? filePath.split('/')[0].replace(/-/g, ' ') : "General");

    // Check if we should hide this card from the main page list
    const hideMatch = mdText.match(/hide:\s*true/i) || mdText.match(/card:\s*false/i);
    const isSubNote = fileName.startsWith('_') || filePath.toLowerCase().includes('/internal/') || filePath.toLowerCase().includes('/subnotes/') || filePath.toLowerCase().includes('internalfile') || mdText.toLowerCase().includes('internalfile');
    const shouldHideCard = hideMatch || isSubNote;

    if (!shouldHideCard) {
      createBlogCard(title, date, excerpt, cleanText, category, fileName);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetPost = urlParams.get('post');
    if (targetPost && (fileName === targetPost || fileName === targetPost + '.md' || title === targetPost)) {
      setTimeout(() => openBlogModal(title, date, cleanText, fileName), 500);
    }
  }

  function createBlogCard(title, date, excerpt, fullContent, category, fileName) {
    const isPinned = fileName.toLowerCase().includes('about aayush') || title.toLowerCase().includes('about aayush');
    const card = document.createElement('article');
    card.className = 'blog-card reveal-up active';
    card.setAttribute('data-category', category);
    if (isPinned) {
      card.style.border = '1px solid rgba(192, 132, 252, 0.4)';
      card.style.position = 'relative';
    }
    card.innerHTML = `
      ${isPinned ? '<i class="ph-fill ph-push-pin" style="position: absolute; top: 15px; right: 15px; color: #c084fc; font-size: 1.2rem; transform: rotate(45deg);"></i>' : ''}
      <div class="blog-date">${isPinned ? 'Pinned' : date} • ${category}</div>
      <h3>${title}</h3>
      <p>${excerpt}</p>
      <a href="#" class="read-more">Read Full Note</a>
    `;
    setupCardInteractions(card, title, date, fullContent, fileName);
    blogGrid.appendChild(card);
  }

  // --- Modal Navigation History Stack ---
  let modalHistory = [];

  // --- Dynamic In-Modal Back Button Injection ---
  const modalBackButton = document.createElement('button');
  modalBackButton.className = 'back-modal-btn';
  modalBackButton.id = 'modalBackButton';
  modalBackButton.title = 'Go Back';
  modalBackButton.innerHTML = `<i class="ph ph-arrow-left"></i>`;
  blogModal.appendChild(modalBackButton);
  makeElementMagnetic(modalBackButton, 0.35); // Apply magnetic effect

  // Back Button Navigation Click Handler
  modalBackButton.addEventListener('click', () => {
    // Simply go back in history, which will trigger the popstate listener
    window.history.back();
  });

  function makeHeadingsCollapsible(container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.cursor = 'pointer';
      heading.classList.add('collapsible-heading');

      let chevron = heading.querySelector('.heading-chevron');
      if (!chevron) {
        chevron = document.createElement('span');
        chevron.className = 'heading-chevron';
        chevron.innerHTML = '<i class="ph ph-caret-down"></i>';
        heading.insertBefore(chevron, heading.firstChild);
      }

      let wrapper = heading.nextElementSibling;
      const alreadyWrapped = wrapper && wrapper.classList.contains('collapsible-content');

      if (!alreadyWrapped) {
        const headingLevel = parseInt(heading.tagName.substring(1));
        const contentNodes = [];
        let nextSibling = heading.nextElementSibling;

        while (nextSibling) {
          if (nextSibling.tagName.match(/^H[1-6]$/i)) {
            const nextLevel = parseInt(nextSibling.tagName.substring(1));
            if (nextLevel <= headingLevel) {
              break;
            }
          }
          contentNodes.push(nextSibling);
          nextSibling = nextSibling.nextElementSibling;
        }

        if (contentNodes.length > 0) {
          wrapper = document.createElement('div');
          wrapper.className = 'collapsible-content expanded';
          heading.parentNode.insertBefore(wrapper, contentNodes[0]);
          contentNodes.forEach(node => {
            wrapper.appendChild(node);
          });
        } else {
          wrapper = null;
        }
      }

      if (wrapper) {
        // Strip duplicate listeners by cloning and replacing heading
        const newHeading = heading.cloneNode(true);
        heading.parentNode.replaceChild(newHeading, heading);

        newHeading.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          const isExpanded = wrapper.classList.contains('expanded');
          const chevronIcon = newHeading.querySelector('.heading-chevron i');

          if (isExpanded) {
            wrapper.classList.remove('expanded');
            wrapper.classList.add('collapsed');
            if (chevronIcon) {
              chevronIcon.className = 'ph ph-caret-right';
            }
          } else {
            wrapper.classList.remove('collapsed');
            wrapper.classList.add('expanded');
            if (chevronIcon) {
              chevronIcon.className = 'ph ph-caret-down';
            }
          }
        });
      }
    });
  }

  // Helper function to load note content asynchronously into modal (without touching history)
  async function loadNoteContentIntoModal(fileName, titleHint) {
    try {
      const cleanNoteName = fileName.split('/').pop();
      let fileWithExt = cleanNoteName;
      if (!fileWithExt.endsWith('.md')) fileWithExt += '.md';

      const filePath = assetMap[fileWithExt] || fileWithExt;
      const encodedPath = encodeURI(filePath);
      const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodedPath}?t=${Date.now()}`;

      modalBody.innerHTML = '<div class="loading-note" style="color: rgba(255,255,255,0.7); text-align: center; padding: 40px;"><i class="ph ph-circle-notch spinner" style="font-size: 2rem; display: block; margin: 0 auto 10px auto; animation: spin 1s linear infinite;"></i>Loading note...</div>';

      const contentRes = await fetch(rawUrl, { cache: 'no-store' });
      if (!contentRes.ok) throw new Error('Note not found');

      const mdText = await contentRes.text();

      let cleanText = mdText;
      if (mdText.trim().startsWith('---')) {
        const parts = mdText.split('---');
        if (parts.length >= 3) cleanText = parts.slice(2).join('---').trim();
      }

      cleanText = cleanText.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, assetName, alt) => {
        const cleanAssetName = assetName.split('/').pop();
        const path = assetMap[cleanAssetName] || assetName;
        const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodeURI(path)}?t=${Date.now()}`;
        return `![${alt || assetName}](${url})`;
      });

      // Defer [[...]] and ==...== to after markdown parsing

      let title = titleHint || cleanNoteName.replace('.md', '').replace(/_/g, ' ');
      const h1Match = cleanText.match(/^#\s+(.*)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
        cleanText = cleanText.replace(h1Match[0], '').trim();
      }

      modalTitle.innerText = title;

      const commitUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/commits?path=${encodedPath}&page=1&per_page=1`;
      let commitRes = await fetch(commitUrl);
      if (commitRes.status === 403 && GITHUB_TOKEN) {
        commitRes = await fetch(commitUrl, { headers: getAuthHeader() });
      }
      let updatedDate = "Recent";
      if (commitRes.ok) {
        const commits = await commitRes.json();
        if (commits.length > 0) {
          const dateObj = new Date(commits[0].commit.committer.date);
          updatedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      modalDate.innerText = updatedDate;

      let htmlContent = '';
      if (typeof marked !== 'undefined') {
        marked.setOptions({
          breaks: true,
          gfm: true,
          highlight: function (code, lang) {
            if (typeof hljs !== 'undefined') {
              const language = hljs.getLanguage(lang) ? lang : 'plaintext';
              return hljs.highlight(code, { language }).value;
            }
            return code;
          }
        });
        htmlContent = marked.parse(cleanText);
      } else {
        htmlContent = cleanText;
      }

      htmlContent = htmlContent.replace(/==([^=]+)==/g, '<mark>$1</mark>');
      htmlContent = htmlContent.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, linkTarget, alias) => {
        const displayName = alias || linkTarget;
        return `<a href="#" class="obsidian-internal-link" data-note="${linkTarget.trim()}">${displayName}</a>`;
      });

      modalBody.innerHTML = htmlContent;
      if (typeof marked !== 'undefined') {
        makeHeadingsCollapsible(modalBody);
      }
      modalBody.scrollTop = 0;

      modalBody.style.opacity = '1';
      modalBody.style.transform = 'none';

      // Ensure modal is active (e.g. forward navigation)
      if (!blogModal.classList.contains('active')) {
        blogModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop();
        const modalGlass = blogModal.querySelector('.modal-glass');
        if (modalGlass) {
          modalGlass.style.opacity = '1';
          modalGlass.style.transform = 'none';
        }
      }
    } catch (err) {
      console.error(err);
      modalBody.innerHTML = `<div class="error-msg" style="color: #ff6b6b; padding: 30px; text-align: center; background: rgba(255,107,107,0.1); border-radius: 16px; border: 1px solid rgba(255,107,107,0.2);"><i class="ph ph-warning-circle" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>Error loading note "${fileName}".<br>Make sure the file exists in your repository.</div>`;
    }
  }

  async function openInternalNote(noteName) {
    try {
      // Save current note state to history stack before loading the new note
      const currentState = {
        title: modalTitle.innerText,
        date: modalDate.innerText,
        html: modalBody.innerHTML,
        scrollTop: modalBody.scrollTop,
        fileName: new URL(window.location).searchParams.get('post')
      };
      modalHistory.push(currentState);
      modalBackButton.classList.add('visible');

      const cleanNoteName = noteName.split('/').pop();
      let fileName = cleanNoteName;
      if (!fileName.endsWith('.md')) fileName += '.md';

      await loadNoteContentIntoModal(fileName);

      // Update the URL and history state
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('post', fileName);
      modalSessionDepth++;
      window.history.pushState({ post: fileName, depth: modalSessionDepth }, '', newUrl);
    } catch (err) {
      console.error(err);
    }
  }

  function openBlogModal(title, date, content, fileName) {
    // Fresh opening: clear history and back button
    modalHistory = [];
    modalBackButton.classList.remove('visible');

    modalTitle.innerText = title;
    modalDate.innerText = date;
    let htmlContent = '';
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code, lang) {
          if (typeof hljs !== 'undefined') {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
          return code;
        }
      });
      htmlContent = marked.parse(content);
    } else {
      htmlContent = content;
    }

    htmlContent = htmlContent.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    htmlContent = htmlContent.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, linkTarget, alias) => {
      const displayName = alias || linkTarget;
      return `<a href="#" class="obsidian-internal-link" data-note="${linkTarget.trim()}">${displayName}</a>`;
    });

    modalBody.innerHTML = htmlContent;
    if (typeof marked !== 'undefined') {
      makeHeadingsCollapsible(modalBody);
    }
    blogModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();

    // Set style properties directly without GSAP
    const modalGlass = blogModal.querySelector('.modal-glass');
    if (modalGlass) {
      modalGlass.style.opacity = '1';
      modalGlass.style.transform = 'none';
    }

    // Update the URL to make the link shareable
    if (fileName) {
      const newUrl = new URL(window.location);
      if (newUrl.searchParams.get('post') !== fileName) {
        newUrl.searchParams.set('post', fileName);
        modalSessionDepth = 1;
        window.history.pushState({ post: fileName, depth: 1 }, '', newUrl);
      }
    }
  }

  function closeBlogModal(isPopState = false) {
    if (isPopState) {
      blogModal.classList.remove('active');
      document.body.style.overflow = '';
      hidePopover();
      modalHistory = [];
      modalBackButton.classList.remove('visible');
      modalSessionDepth = 0;
      if (window.lenis) window.lenis.start();
    } else {
      if (modalSessionDepth > 0) {
        window.history.go(-modalSessionDepth);
      } else {
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('post');
        window.history.replaceState({ post: null, depth: 0 }, '', newUrl);
        
        blogModal.classList.remove('active');
        document.body.style.overflow = '';
        hidePopover();
        modalHistory = [];
        modalBackButton.classList.remove('visible');
        if (window.lenis) window.lenis.start();
      }
    }
  }

  closeModal.addEventListener('click', () => closeBlogModal(false));
  blogModal.addEventListener('click', (e) => { if (e.target === blogModal) closeBlogModal(false); });

  window.addEventListener('popstate', (e) => {
    const state = e.state;
    const post = state && state.post;
    const depth = state && typeof state.depth === 'number' ? state.depth : 0;

    const prevDepth = modalSessionDepth;
    modalSessionDepth = depth;

    if (!post) {
      if (blogModal.classList.contains('active')) {
        closeBlogModal(true);
      }
    } else {
      if (blogModal.classList.contains('active')) {
        if (depth < prevDepth) {
          // User went back! Restore state from cache
          const lastHistoryItem = modalHistory[modalHistory.length - 1];
          if (lastHistoryItem && (lastHistoryItem.fileName === post || lastHistoryItem.title === post)) {
            modalHistory.pop();
            modalTitle.innerText = lastHistoryItem.title;
            modalDate.innerText = lastHistoryItem.date;
            modalBody.innerHTML = lastHistoryItem.html;
            modalBody.scrollTop = lastHistoryItem.scrollTop;

            makeHeadingsCollapsible(modalBody);

            modalBody.style.opacity = '1';
            modalBody.style.transform = 'none';

            if (modalHistory.length === 0) {
              modalBackButton.classList.remove('visible');
            }
          } else {
            // Fallback load
            loadNoteContentIntoModal(post);
          }
        } else {
          // User went forward! Save current note state to cache first
          const currentState = {
            title: modalTitle.innerText,
            date: modalDate.innerText,
            html: modalBody.innerHTML,
            scrollTop: modalBody.scrollTop,
            fileName: new URL(window.location).searchParams.get('post')
          };
          modalHistory.push(currentState);
          modalBackButton.classList.add('visible');

          loadNoteContentIntoModal(post);
        }
      } else {
        // Modal is currently closed, load it
        loadNoteContentIntoModal(post);
      }
    }
  });

  // Intercept clicks on links within the blog modal
  modalBody.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // 1. Handle Obsidian internal wiki links (e.g. [[DBMS TOPIC WISE.pdf]])
    if (link.classList.contains('obsidian-internal-link')) {
      e.preventDefault();
      const noteName = link.getAttribute('data-note');
      
      if (noteName && noteName.toLowerCase().endsWith('.pdf')) {
        const path = assetMap[noteName] || noteName;
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodeURI(path)}`;
        window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}`, '_blank');
        return;
      }

      openInternalNote(noteName);
      hidePopover();
      return;
    }

    // 2. Handle normal Markdown PDF links (e.g. [PDF](DBMS TOPIC.pdf) or absolute URLs)
    const originalHref = link.getAttribute('href');
    if (originalHref && originalHref.toLowerCase().includes('.pdf')) {
      e.preventDefault(); // Stop the browser from attempting a local download

      if (originalHref.includes('raw.githubusercontent.com') || originalHref.includes('raw.github.com')) {
        window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(originalHref)}`, '_blank');
      } else if (originalHref.startsWith('http')) {
        // External non-raw URL (e.g. github blob), just open it normally
        window.open(originalHref, '_blank');
      } else {
        // It's a relative URL, so we construct the raw GitHub URL using the asset map
        const decodedName = decodeURIComponent(originalHref).split('/').pop();
        const path = assetMap[decodedName] || decodedName;
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodeURI(path)}`;
        window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}`, '_blank');
      }
    }
  });

  // (In-Modal Theme Toggle Button Injection Removed)

  // --- Obsidian Interactive Hover Preview Popover ---
  const noteCache = {};
  let hoverTimeout = null;
  let activeNote = null;

  const popover = document.createElement('div');
  popover.className = 'obsidian-preview-popover';
  popover.setAttribute('data-lenis-prevent', '');
  popover.innerHTML = `
    <div class="popover-header">
      <span class="popover-title" id="popoverTitle"></span>
      <button class="popover-expand-btn" id="popoverExpandBtn" title="Open note fully"><i class="ph ph-corners-out"></i></button>
    </div>
    <div class="popover-content" id="popoverContent" data-lenis-prevent></div>
  `;
  document.body.appendChild(popover);

  // Prevent popover scroll/touch events from bubbling up to Lenis smooth scroll
  popover.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  popover.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  makeElementMagnetic(document.getElementById('popoverExpandBtn'), 0.4); // Apply magnetic effect

  async function fetchNoteContent(noteName) {
    if (noteCache[noteName]) return noteCache[noteName];

    const cleanNoteName = noteName.split('/').pop();
    let fileName = cleanNoteName;
    if (!fileName.endsWith('.md')) fileName += '.md';

    const filePath = assetMap[fileName] || fileName;
    const encodedPath = encodeURI(filePath);
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${encodedPath}?t=${Date.now()}`;

    const res = await fetch(rawUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    const mdText = await res.text();

    let cleanText = mdText;
    if (mdText.trim().startsWith('---')) {
      const parts = mdText.split('---');
      if (parts.length >= 3) cleanText = parts.slice(2).join('---').trim();
    }

    // Parse Obsidian images inside preview
    cleanText = cleanText.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, assetName, alt) => {
      const cleanAssetName = assetName.split('/').pop();
      const path = assetMap[cleanAssetName] || assetName;
      const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${path}?t=${Date.now()}`;
      return `![${alt || assetName}](${url})`;
    });

    let previewHtml = '';
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code, lang) {
          if (typeof hljs !== 'undefined') {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
          return code;
        }
      });
      previewHtml = marked.parse(cleanText);
    } else {
      previewHtml = cleanText;
    }

    // Parse internal links inside preview AFTER parsing markdown
    previewHtml = previewHtml.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    previewHtml = previewHtml.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, linkTarget, alias) => {
      const displayName = alias || linkTarget;
      return `<a href="#" class="obsidian-internal-link" data-note="${linkTarget.trim()}">${displayName}</a>`;
    });

    noteCache[noteName] = previewHtml;
    return previewHtml;
  }

  function hidePopover() {
    popover.style.opacity = '0';
    popover.style.pointerEvents = 'none';
    popover.style.transform = 'translateY(10px)';
    activeNote = null;
  }

  modalBody.addEventListener('mouseover', async (e) => {
    const link = e.target.closest('.obsidian-internal-link');
    if (link) {
      clearTimeout(hoverTimeout);
      const noteName = link.getAttribute('data-note');
      activeNote = noteName;

      const rect = link.getBoundingClientRect();
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 8;

      const popoverWidth = 420; // Increased width for better reading space
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 20;
      }
      if (left < 0) left = 10;

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      popover.style.opacity = '1';
      popover.style.transform = 'translateY(0)';
      popover.style.pointerEvents = 'auto';

      document.getElementById('popoverTitle').innerText = noteName.replace('.md', '').replace(/_/g, ' ');
      document.getElementById('popoverContent').innerHTML = '<div class="popover-loading" style="color: rgba(255,255,255,0.5); font-size: 0.85rem; display: flex; align-items: center; gap: 8px;"><i class="ph ph-circle-notch spinner" style="animation: spin 1s linear infinite;"></i> Loading preview...</div>';

      document.getElementById('popoverExpandBtn').onclick = (btnEvent) => {
        btnEvent.stopPropagation();
        openInternalNote(noteName);
        hidePopover();
      };

      try {
        const content = await fetchNoteContent(noteName);
        if (activeNote === noteName) {
          document.getElementById('popoverContent').innerHTML = content;
        }
      } catch (err) {
        if (activeNote === noteName) {
          document.getElementById('popoverContent').innerHTML = '<div style="color: #ff6b6b; font-size: 0.85rem;">Preview not available.</div>';
        }
      }
    }
  });

  modalBody.addEventListener('mouseout', (e) => {
    const link = e.target.closest('.obsidian-internal-link');
    if (link) {
      hoverTimeout = setTimeout(() => {
        hidePopover();
      }, 600); // Generous hide delay for robust hover-entry
    }
  });

  popover.addEventListener('mouseover', () => {
    clearTimeout(hoverTimeout);
  });

  popover.addEventListener('mouseout', (e) => {
    if (!popover.contains(e.relatedTarget)) {
      hoverTimeout = setTimeout(() => {
        hidePopover();
      }, 600);
    }
  });

  fetchGitHubBlogs();

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('i');

  const themeLabel = document.getElementById('themeLabel');

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.classList.replace('ph-moon', 'ph-sun');
    if (themeLabel) themeLabel.innerText = 'Day Mode';
  }

  // Apply magnetic effect to theme toggles & close buttons
  makeElementMagnetic(themeToggle, 0.3);
  makeElementMagnetic(closeModal, 0.35);

  // Navbar Theme Toggle Sync
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeIcon.classList.replace(isLight ? 'ph-moon' : 'ph-sun', isLight ? 'ph-sun' : 'ph-moon');
    if (themeLabel) themeLabel.innerText = isLight ? 'Day Mode' : 'Night Mode';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
});
