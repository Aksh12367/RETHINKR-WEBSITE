/**
 * ReThinkr - Don't dump it. Reimagine it.
 * Core Application Controller, AI Chatbot, Community Feed & NGO Donation Engine
 */

const ReThinkr = {
  data: {
    categories: [],
    items: [],
    ideas: [],
    ngos: [],
    communityPosts: []
  },

  // State keys
  KEYS: {
    USER: 'rethinkr_current_user',
    CUSTOM_IDEAS: 'rethinkr_custom_ideas',
    FAVORITES: 'rethinkr_favorites',
    LIKES: 'rethinkr_likes',
    CUSTOM_ITEMS: 'rethinkr_custom_items',
    COMMUNITY_POSTS: 'rethinkr_community_posts',
    COMMUNITY_LIKES: 'rethinkr_community_likes',
    PICKUPS: 'rethinkr_pickups',
    DONATIONS: 'rethinkr_donations',
    CHAT_HISTORY: 'rethinkr_chat_history'
  },

  // Initialize Application
  async init() {
    this.initUser();
    await this.loadDatabase();
    this.loadNGOs();
    this.loadCommunityPosts();
    this.updateNavAuth();
    this.initGlobalSearch();
    this.initChatbot();
    this.routePage();
  },

  // User Management
  initUser() {
    let user = localStorage.getItem(this.KEYS.USER);
    if (!user) {
      this.currentUser = null;
    } else {
      try {
        this.currentUser = JSON.parse(user);
      } catch (e) {
        this.currentUser = null;
      }
    }
  },

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.KEYS.USER);
    }
    this.updateNavAuth();
  },

  logout() {
    this.setCurrentUser(null);
    window.location.href = 'index.html';
  },

  updateNavAuth() {
    const userContainer = document.getElementById('nav-user-area');
    if (!userContainer) return;

    if (this.currentUser) {
      const isAdmin = this.currentUser.role === 'admin';
      userContainer.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-success dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
            <i class="bi ${isAdmin ? 'bi-shield-check text-warning' : 'bi-person-circle'}"></i>
            <span class="fw-semibold">${this.escapeHtml(this.currentUser.name)}</span>
            ${isAdmin ? '<span class="badge bg-warning text-dark ms-1">Admin</span>' : ''}
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><h6 class="dropdown-header">Signed in as <b>${this.escapeHtml(this.currentUser.email)}</b></h6></li>
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>My Profile & Submissions</a></li>
            <li><a class="dropdown-item" href="submit.html"><i class="bi bi-plus-circle me-2"></i>Submit an Idea</a></li>
            <li><a class="dropdown-item" href="community.html"><i class="bi bi-chat-heart me-2"></i>Community Feed</a></li>
            <li><a class="dropdown-item" href="ngo.html"><i class="bi bi-heart-pulse me-2"></i>NGOs & Donations</a></li>
            ${isAdmin ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item fw-bold text-primary" href="admin.html"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>' : ''}
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-danger" onclick="ReThinkr.logout()"><i class="bi bi-box-arrow-right me-2"></i>Log Out</button></li>
          </ul>
        </div>
      `;
    } else {
      userContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="login.html" class="btn btn-outline-secondary btn-sm px-3 fw-semibold">Log In</a>
          <a href="login.html?tab=register" class="btn btn-primary btn-sm px-3 fw-semibold text-white">Join Free</a>
        </div>
      `;
    }
  },

  // Load Database from JSON / Backend or local script
  async loadDatabase() {
    if (window.RETHINKR_DATABASE) {
      this.data.categories = window.RETHINKR_DATABASE.categories || [];
      this.data.items = window.RETHINKR_DATABASE.items || [];
      this.data.ideas = window.RETHINKR_DATABASE.ideas || [];
    } else {
      try {
        const response = await fetch('data/items_data.json');
        if (!response.ok) throw new Error('Network error loading data');
        const json = await response.json();
        this.data.categories = json.categories || [];
        this.data.items = json.items || [];
        this.data.ideas = json.ideas || [];
      } catch (err) {
        console.warn('Could not load data/items_data.json directly:', err);
      }
    }

    // Merge custom items from local storage
    const customItems = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_ITEMS) || '[]');
    if (customItems.length) {
      this.data.items = [...this.data.items, ...customItems];
    }

    // Merge community submitted ideas
    const customIdeas = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
    if (customIdeas.length) {
      this.data.ideas = [...customIdeas, ...this.data.ideas];
    }
  },

  loadNGOs() {
    if (window.RETHINKR_NGOS) {
      this.data.ngos = window.RETHINKR_NGOS;
    } else {
      fetch('data/ngo_data.json')
        .then(r => r.json())
        .then(data => { this.data.ngos = data; })
        .catch(() => {});
    }
  },

  loadCommunityPosts() {
    let posts = localStorage.getItem(this.KEYS.COMMUNITY_POSTS);
    if (!posts) {
      // Pre-seed initial active community posts
      this.data.communityPosts = [
        {
          id: 101,
          author: "Bhavya Goyal",
          role: "Eco Contributor",
          item: "Worn-Out Denim Jeans",
          title: "Back-pocket wall hanger for remotes & reading glasses!",
          content: "Cut the two back pockets off old jeans with a half-inch border and glued them to a wooden dowel. Perfect for living room clutter and took under 20 mins!",
          materials: ["Worn jeans", "Scissors", "Wooden stick", "Fabric glue"],
          time_ago: "2 hours ago",
          likes: 34,
          comments_count: 5
        },
        {
          id: 102,
          author: "Aksh Mittal",
          role: "Maker & Designer",
          item: "Broken Tablet Screen",
          title: "Turned dead tablet into an ultra-bright tracing lightbox",
          content: "Kept the LCD backlight powered via a 5V USB cord and displayed a blank white screen. It's now my daily calligraphy and architecture sketching lightpad!",
          materials: ["Dead tablet", "USB cable", "Plexiglass"],
          time_ago: "5 hours ago",
          likes: 52,
          comments_count: 8
        },
        {
          id: 103,
          author: "Pari Khurana",
          role: "Curator",
          item: "Paper Egg Carton",
          title: "Biodegradable balcony seed starter pots for mint & basil",
          content: "Cut egg cups apart, poked a small drainage hole in each, and filled with compost. When sprouts got 2 inches tall, planted the entire paper cup straight into my garden pot!",
          materials: ["Egg carton", "Potting soil", "Herb seeds"],
          time_ago: "1 day ago",
          likes: 41,
          comments_count: 4
        },
        {
          id: 104,
          author: "Rohan V.",
          role: "Upcycler",
          item: "Bicycle Inner Tube",
          title: "Made indestructible survival 'Ranger bands' for garage tools",
          content: "Cleaned a punctured butyl rubber tube and sliced it into 1.5-inch rings. They hold heavy garden rakes and hose coils together without rotting in sun or water.",
          materials: ["Inner tube", "Heavy shears"],
          time_ago: "2 days ago",
          likes: 27,
          comments_count: 2
        }
      ];
      localStorage.setItem(this.KEYS.COMMUNITY_POSTS, JSON.stringify(this.data.communityPosts));
    } else {
      try {
        this.data.communityPosts = JSON.parse(posts);
      } catch (e) {
        this.data.communityPosts = [];
      }
    }
  },

  // Get active approved ideas
  getApprovedIdeas() {
    return this.data.ideas.filter(i => i.status === 'approved');
  },

  // Favorites
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || '[]');
  },

  isFavorite(ideaId) {
    return this.getFavorites().includes(Number(ideaId));
  },

  toggleFavorite(ideaId) {
    if (!this.currentUser) {
      alert('Please log in or register to save ideas to your favorites!');
      window.location.href = 'login.html';
      return false;
    }
    ideaId = Number(ideaId);
    let favs = this.getFavorites();
    let isFav = favs.includes(ideaId);
    if (isFav) {
      favs = favs.filter(id => id !== ideaId);
    } else {
      favs.push(ideaId);
    }
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favs));
    return !isFav;
  },

  // Likes
  getLikes() {
    return JSON.parse(localStorage.getItem(this.KEYS.LIKES) || '{}');
  },

  toggleLike(ideaId) {
    let likes = this.getLikes();
    let hasLiked = !!likes[ideaId];
    let idea = this.data.ideas.find(i => i.id === Number(ideaId));
    if (!idea) return;

    if (hasLiked) {
      delete likes[ideaId];
      idea.likes_count = Math.max(0, (idea.likes_count || 1) - 1);
    } else {
      likes[ideaId] = true;
      idea.likes_count = (idea.likes_count || 0) + 1;
    }
    localStorage.setItem(this.KEYS.LIKES, JSON.stringify(likes));
    return { hasLiked: !hasLiked, count: idea.likes_count };
  },

  // Global Header Autocomplete Search
  initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) {
        dropdown.style.display = 'none';
        return;
      }

      const matchedItems = this.data.items.filter(it => 
        it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
      ).slice(0, 4);

      const matchedIdeas = this.getApprovedIdeas().filter(id =>
        id.title.toLowerCase().includes(q) || (id.summary && id.summary.toLowerCase().includes(q))
      ).slice(0, 4);

      if (matchedItems.length === 0 && matchedIdeas.length === 0) {
        dropdown.innerHTML = `<div class="p-3 text-muted text-center"><i class="bi bi-search me-1"></i> No matching items or ideas found.</div>`;
        dropdown.style.display = 'block';
        return;
      }

      let html = '';
      if (matchedItems.length > 0) {
        html += `<div class="p-2 bg-light text-uppercase fw-bold text-muted small px-3">Household Items (${matchedItems.length})</div>`;
        matchedItems.forEach(it => {
          html += `
            <a href="item.html?id=${it.id}" class="autocomplete-item">
              <i class="bi bi-box-seam text-success"></i>
              <div class="flex-grow-1">
                <div class="fw-semibold">${this.escapeHtml(it.name)}</div>
                <small class="text-muted">${it.idea_count || 3} upcycling ideas available</small>
              </div>
              <span class="badge bg-light text-dark border">${it.category_id}</span>
            </a>
          `;
        });
      }

      if (matchedIdeas.length > 0) {
        html += `<div class="p-2 bg-light text-uppercase fw-bold text-muted small px-3">Reuse & Repair Ideas (${matchedIdeas.length})</div>`;
        matchedIdeas.forEach(id => {
          html += `
            <a href="idea.html?id=${id.id}" class="autocomplete-item">
              <i class="bi bi-lightbulb text-warning"></i>
              <div class="flex-grow-1">
                <div class="fw-semibold">${this.escapeHtml(id.title)}</div>
                <small class="text-muted">For: ${this.escapeHtml(id.item_name || 'Item')}</small>
              </div>
              <span class="badge bg-success-subtle text-success">${id.type}</span>
            </a>
          `;
        });
      }

      dropdown.innerHTML = html;
      dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  },

  // ============================================================
  // AI CHATBOT ENGINE ("ReThinkr EcoBot")
  // ============================================================
  initChatbot() {
    // If chatbot container already exists, return
    if (document.getElementById('rethinkr-chatbot-fab')) return;

    // Create FAB & Window
    const fab = document.createElement('div');
    fab.id = 'rethinkr-chatbot-fab';
    fab.className = 'chatbot-fab';
    fab.setAttribute('title', 'Chat with ReThinkr AI EcoBot');
    fab.innerHTML = `
      <i class="bi bi-robot"></i>
      <span class="chatbot-fab-badge"></span>
    `;

    const chatWindow = document.createElement('div');
    chatWindow.id = 'rethinkr-chatbot-window';
    chatWindow.className = 'chatbot-window hidden';
    chatWindow.innerHTML = `
      <div class="chatbot-header">
        <div class="d-flex align-items-center gap-2">
          <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <div class="fw-bold small text-white lh-1">ReThinkr EcoBot</div>
            <small class="text-success-emphasis" style="font-size: 0.7rem; color: #a7f3d0 !important;">● AI Assistant Online</small>
          </div>
        </div>
        <div class="d-flex gap-1">
          <button id="chatbot-clear-btn" class="btn btn-sm text-white-50 p-1" title="Clear Chat"><i class="bi bi-arrow-clockwise"></i></button>
          <button id="chatbot-close-btn" class="btn btn-sm text-white p-1" title="Close"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>

      <div class="chatbot-body" id="chatbot-messages">
        <!-- Initial Welcome Message -->
        <div class="chat-bubble chat-bubble-bot">
          👋 <b>Hello! I'm ReThinkr EcoBot</b>, your AI recycling & reuse guide.<br><br>
          Tell me what item you're holding (like <i>old jeans, wine bottle, pickle jar, broken cable</i>) or ask where to donate items in India!
        </div>
      </div>

      <!-- Quick Prompt Chips -->
      <div class="chat-quick-chips">
        <button class="chat-quick-chip" onclick="ReThinkr.sendChatbotQuery('What can I do with a glass mason jar?')">🍯 Mason Jar</button>
        <button class="chat-quick-chip" onclick="ReThinkr.sendChatbotQuery('How to reuse old jeans without sewing?')">👖 Old Jeans</button>
        <button class="chat-quick-chip" onclick="ReThinkr.sendChatbotQuery('Where can I donate old clothes in India?')">❤️ Donate Clothes</button>
        <button class="chat-quick-chip" onclick="ReThinkr.sendChatbotQuery('How to dispose of e-waste or old phones?')">⚡ E-Waste</button>
        <button class="chat-quick-chip" onclick="ReThinkr.sendChatbotQuery('Show me free 15-minute upcycling ideas')">⏱️ Quick Free Projects</button>
      </div>

      <div class="chatbot-footer">
        <form id="chatbot-form" class="d-flex gap-2">
          <input type="text" id="chatbot-input" class="form-control form-control-sm rounded-pill" placeholder="Ask about an item or donation..." autocomplete="off" required>
          <button type="submit" class="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
            <i class="bi bi-arrow-up-short fs-5"></i>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(chatWindow);

    // Event Listeners
    fab.addEventListener('click', () => {
      chatWindow.classList.toggle('hidden');
      if (!chatWindow.classList.contains('hidden')) {
        document.getElementById('chatbot-input')?.focus();
      }
    });

    document.getElementById('chatbot-close-btn')?.addEventListener('click', () => {
      chatWindow.classList.add('hidden');
    });

    document.getElementById('chatbot-clear-btn')?.addEventListener('click', () => {
      const msgBox = document.getElementById('chatbot-messages');
      if (msgBox) {
        msgBox.innerHTML = `
          <div class="chat-bubble chat-bubble-bot">
            👋 Chat cleared. What item or donation can I help you with today?
          </div>
        `;
      }
    });

    document.getElementById('chatbot-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chatbot-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.sendChatbotQuery(text);
    });
  },

  sendChatbotQuery(query) {
    const msgBox = document.getElementById('chatbot-messages');
    if (!msgBox) return;

    // Add User Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.innerText = query;
    msgBox.appendChild(userBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Add Typing Indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-bubble-bot typing-bubble';
    typingBubble.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
    msgBox.appendChild(typingBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Generate Smart Response after slight delay
    setTimeout(() => {
      typingBubble.remove();
      const botResponse = this.generateBotResponse(query);
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble chat-bubble-bot';
      botBubble.innerHTML = botResponse;
      msgBox.appendChild(botBubble);
      msgBox.scrollTop = msgBox.scrollHeight;
    }, 450);
  },

  generateBotResponse(q) {
    const query = q.toLowerCase();

    // 1. NGO & Donation Questions
    if (query.includes('donate') || query.includes('ngo') || query.includes('clothes donation') || query.includes('charity') || query.includes('pickup')) {
      const ngos = this.data.ngos.length ? this.data.ngos : (window.RETHINKR_NGOS || []);
      let matchedNgo = ngos[0];
      if (query.includes('cloth') || query.includes('textile') || query.includes('blanket')) {
        matchedNgo = ngos.find(n => n.id === 'goonj') || ngos[0];
      } else if (query.includes('phone') || query.includes('electronic') || query.includes('e-waste') || query.includes('computer')) {
        matchedNgo = ngos.find(n => n.id === 'chintan') || ngos[1];
      } else if (query.includes('book') || query.includes('paper') || query.includes('study')) {
        matchedNgo = ngos.find(n => n.id === 'pratham_books') || ngos[4];
      } else if (query.includes('food') || query.includes('meal')) {
        matchedNgo = ngos.find(n => n.id === 'robinhood') || ngos[3];
      }

      return `
        ❤️ <b>Donation Partner Recommendation:</b><br><br>
        <b>${matchedNgo.name}</b> (${matchedNgo.focus})<br>
        <i>"${matchedNgo.tagline}"</i><br><br>
        📦 <b>Accepted Items:</b> ${matchedNgo.accepted_items.slice(0, 3).join(', ')}.<br>
        📍 <b>Coverage:</b> ${matchedNgo.cities}<br><br>
        <div class="d-flex gap-2 mt-2">
          <a href="ngo.html" class="btn btn-sm btn-success text-white fw-semibold">Schedule Free Pickup</a>
          <a href="ngo.html" class="btn btn-sm btn-outline-primary fw-semibold">View All NGOs</a>
        </div>
      `;
    }

    // 2. Search Item & Reuse Ideas
    const matchedItem = this.data.items.find(it => 
      query.includes(it.name.toLowerCase()) || 
      it.name.toLowerCase().split(' ').some(w => w.length > 3 && query.includes(w))
    );

    if (matchedItem) {
      const ideas = this.getApprovedIdeas().filter(id => id.item_id === matchedItem.id);
      let html = `🌿 <b>Great item! Here is how you can upcycle "${matchedItem.name}":</b><br><br>`;
      ideas.slice(0, 2).forEach((id, idx) => {
        html += `
          <div class="p-2 border rounded bg-light mb-2">
            <div class="fw-bold text-success">${idx + 1}. ${this.escapeHtml(id.title)}</div>
            <small class="text-muted d-block">${id.summary}</small>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="badge bg-secondary-subtle text-dark">${id.time_required}</span>
              <a href="idea.html?id=${id.id}" class="small fw-bold text-primary">View Full Steps →</a>
            </div>
          </div>
        `;
      });
      html += `<a href="item.html?id=${matchedItem.id}" class="btn btn-sm btn-outline-success w-100 mt-1">See All ${ideas.length} Ideas for ${matchedItem.name}</a>`;
      return html;
    }

    // 3. Fast Free Projects
    if (query.includes('free') || query.includes('quick') || query.includes('15') || query.includes('easy')) {
      const freeIdeas = this.getApprovedIdeas().filter(id => id.cost_level === 'Free' && id.difficulty === 'Easy').slice(0, 2);
      let html = `⚡ <b>Here are top beginner-friendly, 100% Free projects:</b><br><br>`;
      freeIdeas.forEach(id => {
        html += `
          <div class="p-2 border rounded bg-light mb-2">
            <b>${this.escapeHtml(id.title)}</b> (for ${this.escapeHtml(id.item_name)})<br>
            <small class="text-muted">Tools: ${(id.materials || []).slice(0, 3).join(', ')} | ${id.time_required}</small><br>
            <a href="idea.html?id=${id.id}" class="small fw-bold text-primary">Step-by-step instructions →</a>
          </div>
        `;
      });
      return html;
    }

    // 4. General Circular Economy
    if (query.includes('waste hierarchy') || query.includes('reduce') || query.includes('reuse') || query.includes('landfill')) {
      return `
        ♻️ <b>The Waste Hierarchy (Reduce, Reuse, Recycle):</b><br><br>
        Reusing sits <b>above</b> recycling because it preserves all the embodied energy, water, and raw material that went into manufacturing the item. Recycling melts or breaks down the material, whereas upcycling gives it immediate utility with zero energy!
      `;
    }

    // Default Fallback
    return `
      💡 I can help you find creative upcycling ideas or donate to verified NGOs!<br><br>
      Try searching for an everyday item like:
      • <i>"Wine bottle ideas"</i><br>
      • <i>"What to do with cardboard boxes?"</i><br>
      • <i>"Donate clothes to Goonj"</i><br>
      • <i>"Old t-shirt no-sew tote bag"</i><br><br>
      Or <a href="search.html" class="text-primary fw-bold">browse our full 52-item catalog here</a>.
    `;
  },

  // ============================================================
  // COMMUNITY FEED & COLUMN LOGIC
  // ============================================================
  renderCommunityPage() {
    this.renderCommunityFeed('community-main-feed');
    this.setupCommunitySubmitForm('community-quick-form');
  },

  renderHomeCommunityColumn() {
    this.renderCommunityFeed('home-community-scroll-feed');
    this.setupCommunitySubmitForm('home-community-quick-form');
  },

  renderCommunityFeed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.data.communityPosts.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No community ideas posted yet. Be the first!</div>`;
      return;
    }

    let html = '';
    this.data.communityPosts.forEach(post => {
      const likesMap = JSON.parse(localStorage.getItem(this.KEYS.COMMUNITY_LIKES) || '{}');
      const isLiked = !!likesMap[post.id];

      html += `
        <div class="community-post">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-success-subtle text-success fw-bold rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px; font-size: 0.95rem;">
                ${post.author.charAt(0)}
              </div>
              <div>
                <div class="fw-bold small mb-0">${this.escapeHtml(post.author)}</div>
                <small class="text-muted" style="font-size: 0.72rem;">${post.role || 'Community Member'} • ${post.time_ago}</small>
              </div>
            </div>
            <span class="badge bg-light text-dark border"><i class="bi bi-box-seam me-1"></i> ${this.escapeHtml(post.item)}</span>
          </div>

          <h6 class="fw-bold text-dark mb-1">${this.escapeHtml(post.title)}</h6>
          <p class="text-secondary small mb-2">${this.escapeHtml(post.content)}</p>

          ${post.materials && post.materials.length ? `
            <div class="mb-2">
              ${post.materials.map(m => `<span class="badge bg-secondary-subtle text-dark me-1" style="font-size: 0.68rem;">${this.escapeHtml(m)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="d-flex justify-content-between align-items-center pt-2 border-top small">
            <button class="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1 ${isLiked ? 'text-danger' : 'text-muted'}" onclick="ReThinkr.toggleCommunityLike(${post.id})">
              <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
              <span class="fw-semibold">${post.likes}</span> Likes
            </button>
            <span class="text-muted"><i class="bi bi-chat-dots me-1"></i> ${post.comments_count || 0} Comments</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  setupCommunitySubmitForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = form.querySelector('[name="title"]');
      const itemInput = form.querySelector('[name="item"]');
      const contentInput = form.querySelector('[name="content"]');
      const toolsInput = form.querySelector('[name="tools"]');
      const authorInput = form.querySelector('[name="author"]');

      if (!titleInput || !itemInput || !contentInput) return;

      const newPost = {
        id: Date.now(),
        author: (authorInput && authorInput.value.trim()) ? authorInput.value.trim() : (this.currentUser ? this.currentUser.name : 'Eco Maker'),
        role: this.currentUser && this.currentUser.role === 'admin' ? 'Project Admin' : 'Community Member',
        item: itemInput.value.trim(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        materials: toolsInput && toolsInput.value ? toolsInput.value.split(',').map(s => s.trim()).filter(Boolean) : ["Household scissors", "Glue"],
        time_ago: "Just now",
        likes: 1,
        comments_count: 0
      };

      this.data.communityPosts.unshift(newPost);
      localStorage.setItem(this.KEYS.COMMUNITY_POSTS, JSON.stringify(this.data.communityPosts));

      // Reset form
      form.reset();

      // Refresh feeds
      this.renderCommunityFeed('community-main-feed');
      this.renderCommunityFeed('home-community-scroll-feed');

      alert('Awesome! Your reuse idea has been published live to the community feed.');
    });
  },

  toggleCommunityLike(postId) {
    let likesMap = JSON.parse(localStorage.getItem(this.KEYS.COMMUNITY_LIKES) || '{}');
    const isLiked = !!likesMap[postId];
    const post = this.data.communityPosts.find(p => p.id === postId);
    if (!post) return;

    if (isLiked) {
      delete likesMap[postId];
      post.likes = Math.max(0, post.likes - 1);
    } else {
      likesMap[postId] = true;
      post.likes += 1;
    }

    localStorage.setItem(this.KEYS.COMMUNITY_LIKES, JSON.stringify(likesMap));
    localStorage.setItem(this.KEYS.COMMUNITY_POSTS, JSON.stringify(this.data.communityPosts));

    this.renderCommunityFeed('community-main-feed');
    this.renderCommunityFeed('home-community-scroll-feed');
  },

  // ============================================================
  // NGOs & DONATIONS MODULE
  // ============================================================
  renderNGOPage() {
    this.renderNGOGrid('ngo-directory-grid', 'all');

    // Category filter pills
    document.querySelectorAll('.ngo-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ngo-filter-btn').forEach(b => b.classList.remove('active', 'btn-primary', 'text-white'));
        btn.classList.add('active', 'btn-primary', 'text-white');
        const cat = btn.getAttribute('data-cat') || 'all';
        this.renderNGOGrid('ngo-directory-grid', cat);
      });
    });
  },

  renderHomeNGOColumn() {
    this.renderNGOGrid('home-ngo-directory-grid', 'all', 3);
  },

  renderNGOGrid(containerId, category = 'all', limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let ngos = this.data.ngos.length ? this.data.ngos : (window.RETHINKR_NGOS || []);
    if (category !== 'all') {
      ngos = ngos.filter(n => n.category === category);
    }

    if (limit) {
      ngos = ngos.slice(0, limit);
    }

    let html = '';
    ngos.forEach(ngo => {
      html += `
        <div class="col-md-6 col-lg-${limit ? '12' : '4'} mb-4">
          <div class="ngo-card">
            <div class="ngo-header-banner" style="background-color: ${ngo.color}10;">
              <div class="ngo-logo-box" style="background-color: ${ngo.color}; color: white;">
                <i class="bi ${ngo.logo_icon}"></i>
              </div>
              <div class="overflow-hidden">
                <div class="d-flex align-items-center gap-1">
                  <h5 class="fw-bold mb-0 text-truncate">${this.escapeHtml(ngo.name)}</h5>
                  ${ngo.verified ? '<i class="bi bi-patch-check-fill text-primary" title="Verified Partner"></i>' : ''}
                </div>
                <small class="text-muted d-block text-truncate">${this.escapeHtml(ngo.focus)}</small>
              </div>
            </div>

            <div class="p-3 flex-grow-1 d-flex flex-column justify-content-between">
              <div>
                <p class="text-secondary small mb-3">${this.escapeHtml(ngo.description)}</p>

                <div class="mb-3">
                  <label class="text-uppercase fw-bold text-muted" style="font-size: 0.68rem; letter-spacing: 0.05em;">Accepted Items for Donation</label>
                  <div>
                    ${ngo.accepted_items.map(it => `<span class="ngo-tag">${this.escapeHtml(it)}</span>`).join('')}
                  </div>
                </div>

                <div class="small text-muted mb-3">
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i> ${this.escapeHtml(ngo.cities)}
                </div>

                ${ngo.tax_exemption_80g ? `
                  <div class="badge bg-success-subtle text-success p-2 w-100 text-start mb-3">
                    <i class="bi bi-shield-check me-1"></i> Eligible for 50% Tax Deduction under Section 80G
                  </div>
                ` : ''}
              </div>

              <div>
                <div class="d-grid gap-2">
                  <button class="btn btn-success btn-sm fw-bold" onclick="ReThinkr.openPickupModal('${ngo.id}')">
                    <i class="bi bi-truck me-1"></i> Schedule Item Pickup
                  </button>
                  <button class="btn btn-outline-primary btn-sm fw-semibold" onclick="ReThinkr.openDonationModal('${ngo.id}')">
                    <i class="bi bi-heart me-1"></i> Make Monetary Donation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  openPickupModal(ngoId) {
    const ngos = this.data.ngos.length ? this.data.ngos : (window.RETHINKR_NGOS || []);
    const ngo = ngos.find(n => n.id === ngoId) || ngos[0];

    let modalEl = document.getElementById('pickupModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'pickupModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title fw-bold"><i class="bi bi-truck me-2"></i>Schedule Pickup with ${this.escapeHtml(ngo.name)}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form id="pickup-schedule-form">
            <div class="modal-body p-4">
              <p class="text-muted small mb-3">A partner volunteer or courier will collect your packaged goods directly from your doorstep.</p>
              
              <div class="mb-3">
                <label class="form-label fw-bold small">Your Full Name</label>
                <input type="text" id="pickup-name" class="form-control" value="${this.currentUser ? this.currentUser.name : ''}" required placeholder="e.g. Aksh Mittal">
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label fw-bold small">Phone Number</label>
                  <input type="tel" id="pickup-phone" class="form-control" placeholder="+91 98765 43210" required>
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold small">City</label>
                  <input type="text" id="pickup-city" class="form-control" placeholder="Delhi, Mumbai, etc." required>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold small">Pickup Address & Pincode</label>
                <textarea id="pickup-address" class="form-control" rows="2" placeholder="House/Flat No., Street, Pincode" required></textarea>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label fw-bold small">Items Donating</label>
                  <select id="pickup-items" class="form-select" required>
                    <option value="Clothes & Woolens">Clothes & Woolens</option>
                    <option value="Computers & Electronics">Computers & Electronics</option>
                    <option value="Books & Stationery">Books & Stationery</option>
                    <option value="Cardboard & Dry Waste">Cardboard & Dry Waste</option>
                    <option value="Household Utensils">Household Utensils</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold small">Preferred Date</label>
                  <input type="date" id="pickup-date" class="form-control" required value="2026-11-20">
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-success fw-bold">Confirm & Generate Tracking ID</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('pickup-schedule-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const trackingId = 'RTH-' + ngo.name.substring(0, 4).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      bsModal.hide();
      alert(`🎉 Pickup Scheduled Successfully!\n\nTracking ID: ${trackingId}\nPartner: ${ngo.name}\nOur volunteer will call before arriving for doorstep collection.`);
    });
  },

  openDonationModal(ngoId) {
    const ngos = this.data.ngos.length ? this.data.ngos : (window.RETHINKR_NGOS || []);
    const ngo = ngos.find(n => n.id === ngoId) || ngos[0];

    let modalEl = document.getElementById('donationModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'donationModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold"><i class="bi bi-heart-fill me-2"></i>Donate to ${this.escapeHtml(ngo.name)}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form id="donation-submit-form">
            <div class="modal-body p-4">
              <p class="text-muted small mb-3">Your financial contribution funds logistics, sorting facilities, and distribution of repurposed goods to rural & needy communities.</p>

              <label class="form-label fw-bold small">Choose Contribution Amount (INR ₹)</label>
              <div class="d-flex gap-2 mb-3">
                <button type="button" class="donation-pill-amount flex-grow-1 text-center" onclick="ReThinkr.selectDonationAmount(this, 250)">₹250</button>
                <button type="button" class="donation-pill-amount flex-grow-1 text-center active" onclick="ReThinkr.selectDonationAmount(this, 500)">₹500</button>
                <button type="button" class="donation-pill-amount flex-grow-1 text-center" onclick="ReThinkr.selectDonationAmount(this, 1000)">₹1,000</button>
                <button type="button" class="donation-pill-amount flex-grow-1 text-center" onclick="ReThinkr.selectDonationAmount(this, 2500)">₹2,500</button>
              </div>

              <input type="hidden" id="donation-amount-val" value="500">

              <div class="mb-3">
                <label class="form-label fw-bold small">Donor Name</label>
                <input type="text" id="donor-name" class="form-control" value="${this.currentUser ? this.currentUser.name : ''}" required placeholder="Your Full Name">
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label fw-bold small">Email for 80G Receipt</label>
                  <input type="email" id="donor-email" class="form-control" value="${this.currentUser ? this.currentUser.email : ''}" required placeholder="you@email.com">
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold small">PAN Card (Optional)</label>
                  <input type="text" id="donor-pan" class="form-control" placeholder="ABCDE1234F">
                </div>
              </div>

              <div class="alert alert-success small mb-0">
                <i class="bi bi-shield-lock-fill text-success me-1"></i> Simulated payment gateway mode active. Instant 80G receipt will be generated.
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary fw-bold">Proceed & Generate 80G Receipt</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('donation-submit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = document.getElementById('donation-amount-val')?.value || '500';
      const name = document.getElementById('donor-name')?.value || 'Valued Donor';
      const receiptNo = 'RTH-80G-' + Math.floor(100000 + Math.random() * 900000);
      bsModal.hide();
      alert(`💚 Thank You, ${name}!\n\nYour contribution of ₹${amt} to ${ngo.name} has been processed successfully!\nReceipt Number: ${receiptNo}\nSection 80G Tax Exemption Certificate is recorded.`);
    });
  },

  selectDonationAmount(btn, val) {
    document.querySelectorAll('.donation-pill-amount').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('donation-amount-val');
    if (input) input.value = val;
  },

  // Route Current Page
  routePage() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
      this.renderHomePage();
      this.renderHomeCommunityColumn();
      this.renderHomeNGOColumn();
    } else if (path.endsWith('search.html')) {
      this.renderSearchPage();
    } else if (path.endsWith('item.html')) {
      this.renderItemPage();
    } else if (path.endsWith('idea.html')) {
      this.renderIdeaPage();
    } else if (path.endsWith('submit.html')) {
      this.renderSubmitPage();
    } else if (path.endsWith('profile.html')) {
      this.renderProfilePage();
    } else if (path.endsWith('admin.html')) {
      this.renderAdminPage();
    } else if (path.endsWith('login.html')) {
      this.renderLoginPage();
    } else if (path.endsWith('community.html')) {
      this.renderCommunityPage();
    } else if (path.endsWith('ngo.html')) {
      this.renderNGOPage();
    }
  },

  // 1. Home Page Rendering
  renderHomePage() {
    const catGrid = document.getElementById('home-category-grid');
    if (catGrid) {
      let html = '';
      this.data.categories.forEach(cat => {
        const itemCount = this.data.items.filter(it => it.category_id === cat.id).length;
        html += `
          <div class="col-6 col-md-4 col-lg-3">
            <a href="search.html?category=${cat.id}" class="category-tile h-100">
              <div class="category-icon-box" style="background-color: ${cat.color}15; color: ${cat.color};">
                <i class="bi ${cat.icon}"></i>
              </div>
              <h6 class="fw-bold mb-1">${this.escapeHtml(cat.name)}</h6>
              <span class="text-muted small">${itemCount} items cataloged</span>
            </a>
          </div>
        `;
      });
      catGrid.innerHTML = html;
    }

    const trendingGrid = document.getElementById('home-trending-grid');
    if (trendingGrid) {
      const topIdeas = this.getApprovedIdeas()
        .sort((a, b) => (b.views_count + b.likes_count * 3) - (a.views_count + a.likes_count * 3))
        .slice(0, 6);

      let html = '';
      topIdeas.forEach(idea => {
        html += this.buildIdeaCard(idea);
      });
      trendingGrid.innerHTML = html;
    }

    const totalItemsEl = document.getElementById('stat-total-items');
    const totalIdeasEl = document.getElementById('stat-total-ideas');
    if (totalItemsEl) totalItemsEl.innerText = this.data.items.length + '+';
    if (totalIdeasEl) totalIdeasEl.innerText = this.getApprovedIdeas().length + '+';
  },

  // 2. Search & Filter Page Rendering
  renderSearchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category') || '';
    const initialQuery = urlParams.get('q') || '';

    const searchInput = document.getElementById('search-keyword');
    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    const catSelect = document.getElementById('filter-category');
    if (catSelect) {
      let optHtml = '<option value="">All Categories (8)</option>';
      this.data.categories.forEach(cat => {
        const sel = cat.id === initialCategory ? 'selected' : '';
        optHtml += `<option value="${cat.id}" ${sel}>${this.escapeHtml(cat.name)}</option>`;
      });
      catSelect.innerHTML = optHtml;
    }

    const triggerSearch = () => this.applySearchFilters();

    ['search-keyword', 'filter-category', 'filter-type', 'filter-difficulty', 'filter-cost', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', triggerSearch);
        el.addEventListener('change', triggerSearch);
      }
    });

    document.querySelectorAll('.material-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        triggerSearch();
      });
    });

    this.applySearchFilters();
  },

  applySearchFilters() {
    const q = (document.getElementById('search-keyword')?.value || '').toLowerCase().trim();
    const category = document.getElementById('filter-category')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const difficulty = document.getElementById('filter-difficulty')?.value || '';
    const cost = document.getElementById('filter-cost')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'popular';

    const activeMaterials = Array.from(document.querySelectorAll('.material-filter-pill.active'))
      .map(el => el.getAttribute('data-material').toLowerCase());

    const activeTab = document.querySelector('.search-tab-btn.active')?.getAttribute('data-tab') || 'ideas';

    if (activeTab === 'ideas') {
      let filtered = this.getApprovedIdeas().filter(idea => {
        if (q) {
          const matchTitle = idea.title.toLowerCase().includes(q);
          const matchItem = (idea.item_name || '').toLowerCase().includes(q);
          const matchSummary = (idea.summary || '').toLowerCase().includes(q);
          const matchMaterials = (idea.materials || []).some(m => m.toLowerCase().includes(q));
          if (!matchTitle && !matchItem && !matchSummary && !matchMaterials) return false;
        }

        if (category && idea.category_id !== category) return false;
        if (type && idea.type.toLowerCase() !== type.toLowerCase()) return false;
        if (difficulty && idea.difficulty.toLowerCase() !== difficulty.toLowerCase()) return false;
        if (cost) {
          if (cost === 'Free' && idea.cost_level !== 'Free') return false;
          if (cost === 'Low' && idea.cost_level !== 'Low') return false;
          if (cost === 'Medium' && idea.cost_level !== 'Medium') return false;
        }

        if (activeMaterials.length > 0) {
          const ideaMats = (idea.materials || []).map(m => m.toLowerCase());
          const hasMaterial = activeMaterials.some(am => ideaMats.some(im => im.includes(am)));
          if (!hasMaterial) return false;
        }

        return true;
      });

      if (sort === 'popular') {
        filtered.sort((a, b) => (b.views_count + b.likes_count * 2) - (a.views_count + a.likes_count * 2));
      } else if (sort === 'newest') {
        filtered.sort((a, b) => b.id - a.id);
      } else if (sort === 'cost_asc') {
        filtered.sort((a, b) => (a.estimated_cost || 0) - (b.estimated_cost || 0));
      }

      this.renderIdeaResults(filtered);
    } else {
      let filtered = this.data.items.filter(it => {
        if (q) {
          const matchName = it.name.toLowerCase().includes(q);
          const matchDesc = it.description.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        if (category && it.category_id !== category) return false;
        return true;
      });

      this.renderItemResults(filtered);
    }
  },

  renderIdeaResults(ideas) {
    const container = document.getElementById('search-results-grid');
    const countEl = document.getElementById('search-result-count');
    if (countEl) countEl.innerText = `${ideas.length} ideas found`;

    if (!container) return;
    if (ideas.length === 0) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <i class="bi bi-emoji-neutral text-muted" style="font-size: 3rem;"></i>
          <h5 class="fw-bold mt-3">No matching ideas found</h5>
          <p class="text-muted">Try relaxing your search terms or clearing one of your filters.</p>
          <button class="btn btn-outline-success btn-sm mt-2" onclick="ReThinkr.resetSearchFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    let html = '';
    ideas.forEach(idea => {
      html += this.buildIdeaCard(idea);
    });
    container.innerHTML = html;
  },

  renderItemResults(items) {
    const container = document.getElementById('search-results-grid');
    const countEl = document.getElementById('search-result-count');
    if (countEl) countEl.innerText = `${items.length} household items found`;

    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <i class="bi bi-box-seam text-muted" style="font-size: 3rem;"></i>
          <h5 class="fw-bold mt-3">No matching items found</h5>
          <p class="text-muted">Try searching with a general word like "jar", "bottle", "box", or "shirt".</p>
          <button class="btn btn-outline-success btn-sm mt-2" onclick="ReThinkr.resetSearchFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(it => {
      html += `
        <div class="col-sm-6 col-lg-4 mb-4">
          <div class="rethinkr-card">
            <div class="card-img-wrap">
              <img src="${it.image_url}" alt="${this.escapeHtml(it.name)}" loading="lazy">
              <span class="card-category-badge">${this.escapeHtml(it.category_id)}</span>
            </div>
            <div class="p-3 flex-grow-1 d-flex flex-column justify-content-between">
              <div>
                <h5 class="fw-bold mb-1">${this.escapeHtml(it.name)}</h5>
                <p class="text-muted small mb-2 line-clamp-2">${this.escapeHtml(it.description)}</p>
              </div>
              <div class="pt-2 border-top d-flex align-items-center justify-content-between">
                <span class="badge bg-success-subtle text-success">${it.idea_count || 3} step-by-step ideas</span>
                <a href="item.html?id=${it.id}" class="btn btn-sm btn-outline-primary fw-semibold">View Ideas <i class="bi bi-arrow-right"></i></a>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  resetSearchFilters() {
    const kw = document.getElementById('search-keyword');
    const cat = document.getElementById('filter-category');
    const type = document.getElementById('filter-type');
    const diff = document.getElementById('filter-difficulty');
    const cost = document.getElementById('filter-cost');
    if (kw) kw.value = '';
    if (cat) cat.value = '';
    if (type) type.value = '';
    if (diff) diff.value = '';
    if (cost) cost.value = '';
    document.querySelectorAll('.material-filter-pill.active').forEach(el => el.classList.remove('active'));
    this.applySearchFilters();
  },

  switchSearchTab(tabName) {
    document.querySelectorAll('.search-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active', 'btn-primary', 'text-white');
        btn.classList.remove('btn-outline-secondary');
      } else {
        btn.classList.remove('active', 'btn-primary', 'text-white');
        btn.classList.add('btn-outline-secondary');
      }
    });
    this.applySearchFilters();
  },

  // 3. Item Detail Page Rendering
  renderItemPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = Number(urlParams.get('id') || 1);
    const item = this.data.items.find(i => i.id === itemId);

    if (!item) {
      document.getElementById('item-hero-area').innerHTML = `<div class="container py-5 text-center"><h3>Item Not Found</h3><a href="search.html" class="btn btn-primary mt-3">Back to Catalog</a></div>`;
      return;
    }

    document.title = `${item.name} - Upcycling & Reuse Ideas | ReThinkr`;
    const nameEl = document.getElementById('item-name');
    const descEl = document.getElementById('item-desc');
    const imgEl = document.getElementById('item-img');
    const impactEl = document.getElementById('item-impact');
    const catBadgeEl = document.getElementById('item-cat-badge');

    if (nameEl) nameEl.innerText = item.name;
    if (descEl) descEl.innerText = item.description;
    if (imgEl) imgEl.src = item.image_url;
    if (catBadgeEl) catBadgeEl.innerText = item.category_id;
    if (impactEl) impactEl.innerText = item.disposal_impact;

    const itemIdeas = this.getApprovedIdeas().filter(i => i.item_id === itemId);
    const grid = document.getElementById('item-ideas-grid');
    const countEl = document.getElementById('item-ideas-count');
    if (countEl) countEl.innerText = `Available Ideas (${itemIdeas.length})`;

    if (grid) {
      let html = '';
      itemIdeas.forEach(idea => {
        html += this.buildIdeaCard(idea);
      });
      grid.innerHTML = html;
    }

    const submitBtn = document.getElementById('item-submit-idea-btn');
    if (submitBtn) {
      submitBtn.href = `submit.html?item_id=${item.id}`;
    }
  },

  // 4. Idea Guide Detail Page Rendering
  renderIdeaPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const ideaId = Number(urlParams.get('id') || 1);
    const idea = this.data.ideas.find(i => i.id === ideaId);

    if (!idea) {
      document.getElementById('idea-content-area').innerHTML = `
        <div class="container py-5 text-center">
          <h3>Idea Not Found</h3>
          <p class="text-muted">This idea may have been removed or is pending moderation.</p>
          <a href="search.html" class="btn btn-primary mt-2">Browse All Ideas</a>
        </div>
      `;
      return;
    }

    document.title = `${idea.title} - ReThinkr`;

    const titleEl = document.getElementById('idea-title');
    const typeEl = document.getElementById('idea-type-badge');
    const diffEl = document.getElementById('idea-diff-badge');
    const costEl = document.getElementById('idea-cost-badge');
    const timeEl = document.getElementById('idea-time-badge');
    const authorEl = document.getElementById('idea-author');
    const itemLinkEl = document.getElementById('idea-item-link');
    const imgEl = document.getElementById('idea-img');
    const summaryEl = document.getElementById('idea-summary');
    const likesCountEl = document.getElementById('idea-likes-count');

    if (titleEl) titleEl.innerText = idea.title;
    if (typeEl) {
      typeEl.innerText = idea.type.toUpperCase();
      typeEl.className = `badge badge-${idea.type}`;
    }
    if (diffEl) {
      diffEl.innerText = idea.difficulty;
      diffEl.className = `badge-meta badge-diff-${idea.difficulty.toLowerCase()}`;
    }
    if (costEl) {
      costEl.innerHTML = `<i class="bi bi-tag-fill me-1"></i> ${idea.cost_level} (₹${idea.estimated_cost})`;
      costEl.className = `badge-meta badge-cost-${idea.cost_level.toLowerCase()}`;
    }
    if (timeEl) {
      timeEl.innerHTML = `<i class="bi bi-clock me-1"></i> ${idea.time_required}`;
    }
    if (authorEl) authorEl.innerText = idea.author_name || 'ReThinkr Community';
    if (itemLinkEl) {
      itemLinkEl.innerText = idea.item_name || 'Everyday Item';
      itemLinkEl.href = `item.html?id=${idea.item_id}`;
    }
    if (imgEl) imgEl.src = idea.image_url;
    if (summaryEl) summaryEl.innerText = idea.summary;
    if (likesCountEl) likesCountEl.innerText = idea.likes_count || 0;

    const matList = document.getElementById('idea-materials-list');
    if (matList) {
      let html = '';
      (idea.materials || []).forEach((mat) => {
        html += `
          <div class="material-check-item" onclick="this.classList.toggle('checked')">
            <i class="bi bi-check2-circle text-success fs-5"></i>
            <span class="fw-semibold">${this.escapeHtml(mat)}</span>
          </div>
        `;
      });
      matList.innerHTML = html;
    }

    const stepsList = document.getElementById('idea-steps-list');
    if (stepsList) {
      let html = '';
      (idea.steps || []).forEach((step, idx) => {
        html += `
          <div class="step-item">
            <div class="step-num">${idx + 1}</div>
            <h6 class="fw-bold mb-1">Step ${idx + 1}</h6>
            <p class="text-secondary mb-0">${this.escapeHtml(step)}</p>
          </div>
        `;
      });
      stepsList.innerHTML = html;
    }

    const favBtn = document.getElementById('idea-fav-btn');
    if (favBtn) {
      const isFav = this.isFavorite(idea.id);
      favBtn.innerHTML = isFav 
        ? '<i class="bi bi-bookmark-fill text-warning me-1"></i> Saved to Favorites' 
        : '<i class="bi bi-bookmark me-1"></i> Save to Favorites';
      favBtn.onclick = () => {
        const nowFav = this.toggleFavorite(idea.id);
        favBtn.innerHTML = nowFav 
          ? '<i class="bi bi-bookmark-fill text-warning me-1"></i> Saved to Favorites' 
          : '<i class="bi bi-bookmark me-1"></i> Save to Favorites';
      };
    }

    const likeBtn = document.getElementById('idea-like-btn');
    if (likeBtn) {
      likeBtn.onclick = () => {
        const res = this.toggleLike(idea.id);
        if (res) {
          likesCountEl.innerText = res.count;
          likeBtn.classList.toggle('btn-primary', res.hasLiked);
          likeBtn.classList.toggle('btn-outline-primary', !res.hasLiked);
        }
      };
    }
  },

  // 5. Submit Idea Page Rendering
  renderSubmitPage() {
    if (!this.currentUser) {
      const banner = document.getElementById('submit-auth-warning');
      if (banner) {
        banner.innerHTML = `
          <div class="alert alert-warning d-flex align-items-center gap-2 mb-4">
            <i class="bi bi-exclamation-triangle-fill fs-5"></i>
            <div>
              You are currently viewing as a Guest. 
              <a href="login.html" class="fw-bold alert-link">Log in or Register</a> so your submission is tied to your profile!
            </div>
          </div>
        `;
      }
    }

    const itemSelect = document.getElementById('submit-item-id');
    const urlParams = new URLSearchParams(window.location.search);
    const preItemId = Number(urlParams.get('item_id') || 0);

    if (itemSelect) {
      let optHtml = '<option value="">Select an Item...</option>';
      this.data.items.forEach(it => {
        const sel = it.id === preItemId ? 'selected' : '';
        optHtml += `<option value="${it.id}" ${sel}>${this.escapeHtml(it.name)} (${it.category_id})</option>`;
      });
      itemSelect.innerHTML = optHtml;
    }

    const addMatBtn = document.getElementById('add-material-btn');
    const matInput = document.getElementById('new-material-input');
    const matTagsContainer = document.getElementById('materials-tags-container');

    if (addMatBtn && matInput && matTagsContainer) {
      const addMaterial = () => {
        const val = matInput.value.trim();
        if (!val) return;
        const tag = document.createElement('span');
        tag.className = 'badge bg-success-subtle text-success fs-6 p-2 d-inline-flex align-items-center gap-2';
        tag.innerHTML = `<span>${this.escapeHtml(val)}</span><i class="bi bi-x-circle cursor-pointer" onclick="this.parentElement.remove()"></i>`;
        tag.setAttribute('data-val', val);
        matTagsContainer.appendChild(tag);
        matInput.value = '';
      };
      addMatBtn.addEventListener('click', addMaterial);
      matInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addMaterial();
        }
      });
    }

    const addStepBtn = document.getElementById('add-step-btn');
    const stepsContainer = document.getElementById('steps-builder-container');

    if (addStepBtn && stepsContainer) {
      addStepBtn.addEventListener('click', () => {
        const stepCount = stepsContainer.querySelectorAll('.step-input-row').length + 1;
        const row = document.createElement('div');
        row.className = 'step-input-row mb-3 d-flex gap-2 align-items-start';
        row.innerHTML = `
          <span class="badge bg-primary rounded-circle p-2 fs-6 mt-1" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">${stepCount}</span>
          <textarea class="form-control step-text" rows="2" placeholder="Describe Step ${stepCount} in detail..." required></textarea>
          <button type="button" class="btn btn-outline-danger btn-sm mt-1" onclick="this.closest('.step-input-row').remove()"><i class="bi bi-trash"></i></button>
        `;
        stepsContainer.appendChild(row);
      });
    }

    const form = document.getElementById('submit-idea-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemId = Number(document.getElementById('submit-item-id').value);
        const itemObj = this.data.items.find(i => i.id === itemId);
        const title = document.getElementById('submit-title').value.trim();
        const type = document.getElementById('submit-type').value;
        const difficulty = document.getElementById('submit-difficulty').value;
        const costLevel = document.getElementById('submit-cost-level').value;
        const estCost = Number(document.getElementById('submit-cost').value || 0);
        const timeReq = document.getElementById('submit-time').value.trim();
        const summary = document.getElementById('submit-summary').value.trim();
        const imgUrl = document.getElementById('submit-image-url').value.trim() || (itemObj ? itemObj.image_url : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600');

        const materials = Array.from(document.querySelectorAll('#materials-tags-container [data-val]'))
          .map(el => el.getAttribute('data-val'));

        const steps = Array.from(document.querySelectorAll('#steps-builder-container .step-text'))
          .map(el => el.value.trim())
          .filter(Boolean);

        if (materials.length === 0) {
          alert('Please add at least one required tool or material!');
          return;
        }

        if (steps.length === 0) {
          alert('Please add at least one instruction step!');
          return;
        }

        const newId = 1000 + Math.floor(Math.random() * 9000);
        const newIdea = {
          id: newId,
          item_id: itemId,
          item_name: itemObj ? itemObj.name : 'Custom Item',
          category_id: itemObj ? itemObj.category_id : 'plastics',
          user_id: this.currentUser ? this.currentUser.id : 99,
          author_name: this.currentUser ? this.currentUser.name : 'Anonymous Maker',
          title: title,
          type: type,
          difficulty: difficulty,
          cost_level: costLevel,
          estimated_cost: estCost,
          time_required: timeReq,
          materials: materials,
          steps: steps,
          summary: summary,
          image_url: imgUrl,
          status: 'pending',
          likes_count: 0,
          views_count: 1,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const customIdeas = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
        customIdeas.unshift(newIdea);
        localStorage.setItem(this.KEYS.CUSTOM_IDEAS, JSON.stringify(customIdeas));

        alert('Success! Your creative reuse idea has been submitted and is saved as "Pending". It will become visible to all users once approved by the admin.');
        window.location.href = 'profile.html';
      });
    }
  },

  // 6. User Profile Page Rendering
  renderProfilePage() {
    if (!this.currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const userNameEl = document.getElementById('profile-user-name');
    const userEmailEl = document.getElementById('profile-user-email');
    const userRoleBadge = document.getElementById('profile-role-badge');

    if (userNameEl) userNameEl.innerText = this.currentUser.name;
    if (userEmailEl) userEmailEl.innerText = this.currentUser.email;
    if (userRoleBadge) {
      userRoleBadge.innerText = this.currentUser.role.toUpperCase();
      userRoleBadge.className = this.currentUser.role === 'admin' ? 'badge bg-warning text-dark' : 'badge bg-primary';
    }

    const allCustom = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
    const userSubmissions = allCustom.filter(i => i.user_id === this.currentUser.id);
    const subCountEl = document.getElementById('profile-submissions-count');
    const subGrid = document.getElementById('profile-submissions-grid');

    if (subCountEl) subCountEl.innerText = userSubmissions.length;
    if (subGrid) {
      if (userSubmissions.length === 0) {
        subGrid.innerHTML = `
          <div class="col-12 py-4 text-center">
            <i class="bi bi-lightbulb text-muted fs-1"></i>
            <h6 class="fw-bold mt-2">No ideas submitted yet</h6>
            <p class="text-muted small">Have a clever way to repurpose an old object? Share it with the community!</p>
            <a href="submit.html" class="btn btn-outline-success btn-sm">Submit Your First Idea</a>
          </div>
        `;
      } else {
        let html = '';
        userSubmissions.forEach(idea => {
          let statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i> Pending Moderation</span>';
          if (idea.status === 'approved') {
            statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Live & Approved</span>';
          } else if (idea.status === 'rejected') {
            statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> Needs Revision</span>';
          }

          html += `
            <div class="col-md-6 mb-3">
              <div class="rethinkr-card p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="fw-bold mb-0">${this.escapeHtml(idea.title)}</h6>
                  ${statusBadge}
                </div>
                <p class="text-muted small mb-2">${this.escapeHtml(idea.summary)}</p>
                <div class="d-flex align-items-center justify-content-between pt-2 border-top small text-muted">
                  <span>For: <b>${this.escapeHtml(idea.item_name)}</b></span>
                  <span>${idea.time_required}</span>
                  <a href="idea.html?id=${idea.id}" class="btn btn-sm btn-link p-0">Preview <i class="bi bi-arrow-right"></i></a>
                </div>
              </div>
            </div>
          `;
        });
        subGrid.innerHTML = html;
      }
    }

    const favIds = this.getFavorites();
    const favGrid = document.getElementById('profile-favorites-grid');
    const favCountEl = document.getElementById('profile-favorites-count');

    const favIdeas = this.data.ideas.filter(i => favIds.includes(i.id));
    if (favCountEl) favCountEl.innerText = favIdeas.length;

    if (favGrid) {
      if (favIdeas.length === 0) {
        favGrid.innerHTML = `
          <div class="col-12 py-4 text-center">
            <i class="bi bi-bookmark text-muted fs-1"></i>
            <h6 class="fw-bold mt-2">No saved ideas</h6>
            <p class="text-muted small">Browse the catalog and click "Save to Favorites" to build your eco-project wishlist.</p>
            <a href="search.html" class="btn btn-outline-primary btn-sm">Explore Ideas</a>
          </div>
        `;
      } else {
        let html = '';
        favIdeas.forEach(idea => {
          html += this.buildIdeaCard(idea);
        });
        favGrid.innerHTML = html;
      }
    }
  },

  // 7. Admin Moderation Dashboard
  renderAdminPage() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      alert('Access restricted. Please log in as an administrator to access the moderation panel.');
      window.location.href = 'login.html';
      return;
    }

    const totalItemsEl = document.getElementById('admin-stat-items');
    const totalIdeasEl = document.getElementById('admin-stat-ideas');
    const pendingCountEl = document.getElementById('admin-stat-pending');

    const allCustom = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
    const pendingIdeas = allCustom.filter(i => i.status === 'pending');

    if (totalItemsEl) totalItemsEl.innerText = this.data.items.length;
    if (totalIdeasEl) totalIdeasEl.innerText = this.getApprovedIdeas().length;
    if (pendingCountEl) pendingCountEl.innerText = pendingIdeas.length;

    const queueContainer = document.getElementById('admin-moderation-queue');
    if (queueContainer) {
      if (pendingIdeas.length === 0) {
        queueContainer.innerHTML = `
          <div class="p-4 text-center text-muted">
            <i class="bi bi-shield-check text-success fs-1"></i>
            <h5 class="fw-bold mt-2">Moderation Queue is Clear!</h5>
            <p class="small">All community submissions have been reviewed and processed.</p>
          </div>
        `;
      } else {
        let html = '';
        pendingIdeas.forEach(idea => {
          html += `
            <div class="card mb-3 border-warning shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge bg-warning text-dark mb-1">PENDING REVIEW</span>
                    <h5 class="fw-bold mb-1">${this.escapeHtml(idea.title)}</h5>
                    <p class="text-muted small mb-2">Item: <b>${this.escapeHtml(idea.item_name)}</b> | By: <b>${this.escapeHtml(idea.author_name)}</b> | Time: ${idea.time_required}</p>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-success btn-sm fw-semibold" onclick="ReThinkr.moderateIdea(${idea.id}, 'approved')">
                      <i class="bi bi-check-lg me-1"></i> Approve
                    </button>
                    <button class="btn btn-outline-danger btn-sm fw-semibold" onclick="ReThinkr.moderateIdea(${idea.id}, 'rejected')">
                      <i class="bi bi-x-lg me-1"></i> Reject
                    </button>
                  </div>
                </div>
                <div class="bg-light p-3 rounded mb-2 small">
                  <b>Summary:</b> ${this.escapeHtml(idea.summary)}<br>
                  <b>Materials:</b> ${(idea.materials || []).join(', ')}<br>
                  <b>Steps:</b> ${idea.steps ? idea.steps.length : 0} steps included
                </div>
                <a href="idea.html?id=${idea.id}" target="_blank" class="small text-primary fw-semibold">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Open full idea preview in new tab
                </a>
              </div>
            </div>
          `;
        });
        queueContainer.innerHTML = html;
      }
    }

    const catDist = document.getElementById('admin-category-dist');
    if (catDist) {
      let html = '';
      this.data.categories.forEach(cat => {
        const count = this.data.items.filter(i => i.category_id === cat.id).length;
        const percent = Math.round((count / this.data.items.length) * 100);
        html += `
          <div class="mb-3">
            <div class="d-flex justify-content-between small fw-semibold mb-1">
              <span>${this.escapeHtml(cat.name)}</span>
              <span>${count} items (${percent}%)</span>
            </div>
            <div class="progress" style="height: 8px;">
              <div class="progress-bar" role="progressbar" style="width: ${percent}%; background-color: ${cat.color};"></div>
            </div>
          </div>
        `;
      });
      catDist.innerHTML = html;
    }
  },

  moderateIdea(ideaId, newStatus) {
    let allCustom = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
    let target = allCustom.find(i => i.id === ideaId);
    if (!target) return;

    target.status = newStatus;
    localStorage.setItem(this.KEYS.CUSTOM_IDEAS, JSON.stringify(allCustom));
    alert(`Idea #${ideaId} marked as ${newStatus.toUpperCase()}! It has been updated in the database.`);
    this.renderAdminPage();
  },

  // 8. Login & Registration Page
  renderLoginPage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'register') {
      const regTab = document.getElementById('pills-register-tab');
      if (regTab) regTab.click();
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const role = email.includes('admin') ? 'admin' : 'user';
        const name = email.includes('admin') ? 'Admin Meghna' : email.split('@')[0];

        this.setCurrentUser({
          id: email.includes('admin') ? 1 : 2,
          name: name,
          email: email,
          role: role
        });

        alert(`Welcome back, ${name}! Logged in as ${role.toUpperCase()}.`);
        window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
      });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();

        this.setCurrentUser({
          id: Math.floor(Math.random() * 8000) + 100,
          name: name,
          email: email,
          role: 'user'
        });

        alert(`Account created successfully! Welcome to ReThinkr, ${name}.`);
        window.location.href = 'index.html';
      });
    }
  },

  quickLogin(role) {
    if (role === 'admin') {
      this.setCurrentUser({
        id: 1,
        name: 'Admin Meghna',
        email: 'admin@rethinkr.org',
        role: 'admin'
      });
      alert('Logged in as Administrator (Meghna Jain). Redirecting to Admin Moderation Dashboard...');
      window.location.href = 'admin.html';
    } else {
      this.setCurrentUser({
        id: 2,
        name: 'Eco Warrior Bhavya',
        email: 'user@rethinkr.org',
        role: 'user'
      });
      alert('Logged in as Registered User (Bhavya Goyal). Redirecting to homepage...');
      window.location.href = 'index.html';
    }
  },

  buildIdeaCard(idea) {
    const isFav = this.isFavorite(idea.id);
    return `
      <div class="col-sm-6 col-lg-4 mb-4">
        <div class="rethinkr-card">
          <div class="card-img-wrap">
            <img src="${idea.image_url}" alt="${this.escapeHtml(idea.title)}" loading="lazy">
            <span class="card-category-badge">${idea.category_id}</span>
            <span class="card-type-badge badge-${idea.type}">${idea.type}</span>
          </div>
          <div class="p-3 flex-grow-1 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-1 mb-1">
                <span class="badge-meta badge-diff-${idea.difficulty.toLowerCase()}">${idea.difficulty}</span>
                <span class="badge-meta badge-cost-${idea.cost_level.toLowerCase()}">
                  <i class="bi bi-tag-fill me-1"></i> ${idea.cost_level} (${idea.estimated_cost === 0 ? '₹0' : '₹' + idea.estimated_cost})
                </span>
              </div>
              <h5 class="fw-bold mb-1 fs-6">${this.escapeHtml(idea.title)}</h5>
              <p class="text-muted small mb-2 line-clamp-2">${this.escapeHtml(idea.summary)}</p>
            </div>
            <div>
              <div class="d-flex align-items-center justify-content-between text-muted small pt-2 border-top">
                <span><i class="bi bi-box-seam me-1"></i> ${this.escapeHtml(idea.item_name || 'Item')}</span>
                <span><i class="bi bi-clock me-1"></i> ${idea.time_required}</span>
              </div>
              <div class="d-flex gap-2 mt-2">
                <a href="idea.html?id=${idea.id}" class="btn btn-sm btn-primary text-white flex-grow-1 fw-semibold">
                  View Steps <i class="bi bi-arrow-right"></i>
                </a>
                <button class="btn btn-sm btn-outline-secondary" onclick="ReThinkr.toggleFavorite(${idea.id}); this.querySelector('i').classList.toggle('text-warning'); this.querySelector('i').classList.toggle('bi-bookmark-fill'); this.querySelector('i').classList.toggle('bi-bookmark');" title="Save Favorite">
                  <i class="bi ${isFav ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'}"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ReThinkr.init();
});
