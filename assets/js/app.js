/**
 * ReThinkr - Don't dump it. Reimagine it.
 * Core Application Controller & State Engine
 */

const ReThinkr = {
  data: {
    categories: [],
    items: [],
    ideas: []
  },

  // State keys
  KEYS: {
    USER: 'rethinkr_current_user',
    CUSTOM_IDEAS: 'rethinkr_custom_ideas',
    FAVORITES: 'rethinkr_favorites',
    LIKES: 'rethinkr_likes',
    CUSTOM_ITEMS: 'rethinkr_custom_items'
  },

  // Initialize Application
  async init() {
    this.initUser();
    await this.loadDatabase();
    this.updateNavAuth();
    this.initGlobalSearch();
    this.routePage();
  },

  // User Management
  initUser() {
    let user = localStorage.getItem(this.KEYS.USER);
    if (!user) {
      // Default to guest visitor
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

      // Search items and ideas
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

  // Route Current Page
  routePage() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
      this.renderHomePage();
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
    }
  },

  // 1. Home Page Rendering
  renderHomePage() {
    // Render Category Grid
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

    // Render Trending Ideas
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

    // Render Community Recent Feed
    const communityGrid = document.getElementById('home-community-grid');
    if (communityGrid) {
      const recentIdeas = this.getApprovedIdeas().slice(-4).reverse();
      let html = '';
      recentIdeas.forEach(idea => {
        html += this.buildIdeaCard(idea);
      });
      communityGrid.innerHTML = html;
    }

    // Hero stats
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
    const initialType = urlParams.get('type') || '';
    const initialDiff = urlParams.get('difficulty') || '';

    const searchInput = document.getElementById('search-keyword');
    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    // Populate Category Filter dropdown / pills
    const catSelect = document.getElementById('filter-category');
    if (catSelect) {
      let optHtml = '<option value="">All Categories (8)</option>';
      this.data.categories.forEach(cat => {
        const sel = cat.id === initialCategory ? 'selected' : '';
        optHtml += `<option value="${cat.id}" ${sel}>${this.escapeHtml(cat.name)}</option>`;
      });
      catSelect.innerHTML = optHtml;
    }

    // Setup Filter Listeners
    const triggerSearch = () => this.applySearchFilters();

    ['search-keyword', 'filter-category', 'filter-type', 'filter-difficulty', 'filter-cost', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', triggerSearch);
        el.addEventListener('change', triggerSearch);
      }
    });

    // Material tags click filter
    document.querySelectorAll('.material-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        triggerSearch();
      });
    });

    // Initial search
    this.applySearchFilters();
  },

  applySearchFilters() {
    const q = (document.getElementById('search-keyword')?.value || '').toLowerCase().trim();
    const category = document.getElementById('filter-category')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const difficulty = document.getElementById('filter-difficulty')?.value || '';
    const cost = document.getElementById('filter-cost')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'popular';

    // Active material filters
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

      // Sort
      if (sort === 'popular') {
        filtered.sort((a, b) => (b.views_count + b.likes_count * 2) - (a.views_count + a.likes_count * 2));
      } else if (sort === 'newest') {
        filtered.sort((a, b) => b.id - a.id);
      } else if (sort === 'cost_asc') {
        filtered.sort((a, b) => (a.estimated_cost || 0) - (b.estimated_cost || 0));
      }

      this.renderIdeaResults(filtered);
    } else {
      // Items tab
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
            <div class="p-3 flex-grow-1 d-flex flex-direction-column justify-content-between">
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

    // Fill Item Details
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

    // Load ideas for this item
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

    // Preset for submit idea for this item
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

    // Populate header info
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

    // Materials Checklist
    const matList = document.getElementById('idea-materials-list');
    if (matList) {
      let html = '';
      (idea.materials || []).forEach((mat, idx) => {
        html += `
          <div class="material-check-item" onclick="this.classList.toggle('checked')">
            <i class="bi bi-check2-circle text-success fs-5"></i>
            <span class="fw-semibold">${this.escapeHtml(mat)}</span>
          </div>
        `;
      });
      matList.innerHTML = html;
    }

    // Step-by-Step Timeline
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

    // Favorite button state
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

    // Like button
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

    // Populate Item select
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

    // Materials Adder
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

    // Steps Builder
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

    // Form Submission
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

        // Extract Materials
        const materials = Array.from(document.querySelectorAll('#materials-tags-container [data-val]'))
          .map(el => el.getAttribute('data-val'));

        // Extract Steps
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
          status: 'pending', // Pending Admin Moderation as specified in synopsis!
          likes_count: 0,
          views_count: 1,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        // Save in localStorage
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

    // User Submissions
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

    // User Saved Favorites
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

    // Analytics Counter
    const totalItemsEl = document.getElementById('admin-stat-items');
    const totalIdeasEl = document.getElementById('admin-stat-ideas');
    const pendingCountEl = document.getElementById('admin-stat-pending');

    const allCustom = JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_IDEAS) || '[]');
    const pendingIdeas = allCustom.filter(i => i.status === 'pending');

    if (totalItemsEl) totalItemsEl.innerText = this.data.items.length;
    if (totalIdeasEl) totalIdeasEl.innerText = this.getApprovedIdeas().length;
    if (pendingCountEl) pendingCountEl.innerText = pendingIdeas.length;

    // Render Pending Moderation Queue
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

    // Render Category Distribution
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

  // Moderate Idea action
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

    // Handle Login Submit
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

    // Handle Registration Submit
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

  // Quick Demo Login helper
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

  // Shared Helper: Build Idea Card HTML
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
