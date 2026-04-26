// watchlist-page.js - loads, filters, sorts, and manages watchlist entries.

(() => {
  const listEl     = document.getElementById('watchlistList');
  const loadingEl  = document.getElementById('wlLoading');
  const emptyEl    = document.getElementById('wlEmpty');
  const errorEl    = document.getElementById('wlError');
  const controlsEl = document.getElementById('watchlistControls');
  const countEl    = document.getElementById('watchlistCount');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const sortSelect = document.getElementById('wlSortSelect');

  // Delete confirmation modal
  const deleteModal   = document.getElementById('deleteModal');
  const deleteText    = document.getElementById('deleteModalText');
  const deleteConfirm = document.getElementById('deleteModalConfirm');
  const deleteCancel  = document.getElementById('deleteModalCancel');
  const deleteClose   = document.getElementById('deleteModalClose');

  // remember the last filter/sort between page loads
  const PREFS_KEY = 'wl_prefs';
  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
  };
  const savePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ filter: activeFilter, sort: activeSort }));
  };

  let allEntries      = [];
  const savedPrefs    = loadPrefs();
  let activeFilter    = savedPrefs.filter || 'all';
  let activeSort      = savedPrefs.sort   || 'newest';
  let pendingDeleteId = null;
  let isDeleting      = false;

  const sortEntries = (entries) => {
    const sorted = [...entries];
    if (activeSort === 'newest') {
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    } else if (activeSort === 'oldest') {
      sorted.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
    } else if (activeSort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (activeSort === 'rating') {
      sorted.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    }
    return sorted;
  };

  const buildStarDisplay = (rating) => {
    return [1,2,3,4,5].map(n =>
      `<span class="star-display ${n <= rating ? 'star-display--filled' : ''}">★</span>`
    ).join('');
  };

  const renderStats = (entries) => {
    if (!entries.length) {
      document.getElementById('statsSection').style.display = 'none';
      document.getElementById('statsDivider').style.display = 'none';
      return;
    }

    const total     = entries.length;
    const want      = entries.filter((e) => e.status === 'Want to Watch').length;
    const watching  = entries.filter((e) => e.status === 'Watching').length;
    const completed = entries.filter((e) => e.status === 'Completed').length;

    document.getElementById('statTotal').textContent     = total;
    document.getElementById('statWant').textContent      = want;
    document.getElementById('statWatching').textContent  = watching;
    document.getElementById('statCompleted').textContent = completed;

    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('statsDivider').style.display = 'block';

  };

  const openDeleteModal = (id, title) => {
    pendingDeleteId = id;
    deleteText.textContent = `Remove "${title}" from your watchlist?`;
    deleteModal.classList.add('open');
  };

  const closeDeleteModal = () => {
    pendingDeleteId = null;
    deleteModal.classList.remove('open');
  };

  deleteClose.addEventListener('click',  closeDeleteModal);
  deleteCancel.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.classList.contains('open')) {
      closeDeleteModal();
    }
  });

  deleteConfirm.addEventListener('click', async () => {
    if (!pendingDeleteId || isDeleting) return;
    isDeleting = true;
    deleteConfirm.disabled    = true;
    deleteConfirm.textContent = 'Removing...';

    try {
      await WatchlistAPI.remove(pendingDeleteId);
      allEntries = allEntries.filter((e) => e.id !== pendingDeleteId);
      closeDeleteModal();
      renderList();
      Toast.success('Film removed from watchlist.');
    } catch (err) {
      Toast.error('Could not remove: ' + err.message);
    } finally {
      isDeleting                = false;
      deleteConfirm.disabled    = false;
      deleteConfirm.textContent = 'Remove';
    }
  });

  const showSkeleton = (count = 4) => {
    listEl.innerHTML  = '';
    listEl.style.display = 'flex';
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className  = 'watchlist-item skeleton-item';
      sk.innerHTML  = `
        <div class="skeleton skeleton-poster"></div>
        <div class="skeleton-info">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-meta"></div>
        </div>`;
      listEl.appendChild(sk);
    }
  };

  const buildItem = (entry) => {
    const posterSrc = entry.posterPath
      ? TMDB.posterUrl(entry.posterPath, 'w92')
      : null;

    const item = document.createElement('div');
    item.className  = 'watchlist-item';
    item.dataset.id = entry.id;

    item.innerHTML = `
      ${posterSrc
        ? `<img class="watchlist-item__poster" src="${posterSrc}" alt="${escapeHtml(entry.title)}" loading="lazy">`
        : `<div class="watchlist-item__poster-placeholder"></div>`
      }
      <div class="watchlist-item__info">
        <a class="watchlist-item__title"
           href="movie.html?id=${encodeURIComponent(entry.tmdbId)}">
          ${escapeHtml(entry.title)}
        </a>
        <div class="watchlist-item__meta">
          ${statusBadge(entry.status)}
          ${entry.releaseYear
            ? `<span class="mono muted">${escapeHtml(entry.releaseYear)}</span>`
            : ''}
          ${entry.rating
            ? `<span class="mono muted">TMDB ★ ${escapeHtml(String(entry.rating))}</span>`
            : ''}
        </div>
        ${entry.userRating
          ? `<p class="watchlist-item__user-rating"><span class="user-rating-label">Your rating</span>${buildStarDisplay(parseInt(entry.userRating))}</p>`
          : ''}
        ${entry.note
          ? `<p class="watchlist-item__note">${escapeHtml(entry.note)}</p>`
          : ''}
      </div>
      <div class="watchlist-item__actions">
        <button class="btn btn--ghost btn--sm edit-btn"   data-id="${entry.id}">Edit</button>
        <button class="btn btn--ghost btn--sm delete-btn" data-id="${entry.id}">Remove</button>
      </div>

      <!-- Inline edit form - hidden by default, toggled by edit button -->
      <div class="watchlist-item__edit-form" id="editForm-${entry.id}">
        <div class="form-group">
          <label>Status</label>
          <select class="form-control edit-status" data-id="${entry.id}">
            <option value="Want to Watch" ${entry.status === 'Want to Watch' ? 'selected' : ''}>Want to Watch</option>
            <option value="Watching"      ${entry.status === 'Watching'      ? 'selected' : ''}>Watching</option>
            <option value="Completed"     ${entry.status === 'Completed'     ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Your Rating</label>
          <div class="star-picker" id="starPicker-${entry.id}" data-value="${entry.userRating || 0}">
            ${[1,2,3,4,5].map(n => `
              <button type="button" class="star-btn ${parseInt(entry.userRating || 0) >= n ? 'active' : ''}"
                data-value="${n}" title="${n} star${n > 1 ? 's' : ''}">★</button>
            `).join('')}
            ${entry.userRating ? `<button type="button" class="star-clear-btn" title="Clear rating">✕</button>` : ''}
          </div>
        </div>
        <div class="form-group form-group--wide">
          <label>Note <span id="editCharCount-${entry.id}" class="char-count">${(entry.note || '').length} / 200</span></label>
          <input
            type="text"
            class="form-control edit-note"
            data-id="${entry.id}"
            value="${escapeHtml(entry.note || '')}"
            placeholder="Add a note..."
            maxlength="200"
          />
          <p class="field-error" id="editNoteError-${entry.id}"></p>
        </div>
        <div class="form-btn-row">
          <button class="btn btn--primary btn--sm save-btn"        data-id="${entry.id}">Save</button>
          <button class="btn btn--outline btn--sm cancel-edit-btn" data-id="${entry.id}">Cancel</button>
        </div>
      </div>`;

    // Character counter for the edit note
    const editNoteEl  = item.querySelector('.edit-note');
    const editCountEl = item.querySelector(`#editCharCount-${entry.id}`);
    editNoteEl.addEventListener('input', () => {
      const len = editNoteEl.value.length;
      if (editCountEl) {
        editCountEl.textContent = `${len} / 200`;
        editCountEl.style.color = len > 180 ? 'var(--red)' : 'var(--text-muted)';
      }
    });

    // hover previews the rating, clicking locks it in
    const starPicker = item.querySelector(`#starPicker-${entry.id}`);
    if (starPicker) {
      const updateActiveStars = (val) => {
        starPicker.dataset.value = val;
        starPicker.querySelectorAll('.star-btn').forEach((b) => {
          b.classList.toggle('active', parseInt(b.dataset.value) <= val);
        });
      };

      starPicker.querySelectorAll('.star-btn').forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
          const val = parseInt(btn.dataset.value);
          starPicker.querySelectorAll('.star-btn').forEach((b) => {
            b.classList.toggle('hover', parseInt(b.dataset.value) <= val);
          });
        });

        btn.addEventListener('mouseleave', () => {
          starPicker.querySelectorAll('.star-btn').forEach((b) => b.classList.remove('hover'));
        });

        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.value);
          updateActiveStars(val);

          if (!starPicker.querySelector('.star-clear-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.type        = 'button';
            clearBtn.className   = 'star-clear-btn';
            clearBtn.title       = 'Clear rating';
            clearBtn.textContent = '✕';
            starPicker.appendChild(clearBtn);

            clearBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              updateActiveStars(0);
              clearBtn.remove();
            });
          }
        });
      });

      const existingClear = starPicker.querySelector('.star-clear-btn');
      if (existingClear) {
        existingClear.addEventListener('click', (e) => {
          e.stopPropagation();
          updateActiveStars(0);
          existingClear.remove();
        });
      }
    }

    item.querySelector('.edit-btn').addEventListener('click', () => {
      item.querySelector(`#editForm-${entry.id}`).classList.toggle('open');
    });

    item.querySelector('.cancel-edit-btn').addEventListener('click', () => {
      item.querySelector(`#editForm-${entry.id}`).classList.remove('open');
    });

    editNoteEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.querySelector(`#editForm-${entry.id}`).classList.remove('open');
      }
    });

    // guard against double-saving if the button gets clicked twice fast
    let isSaving = false;
    item.querySelector('.save-btn').addEventListener('click', async () => {
      if (isSaving) return;

      const saveBtn  = item.querySelector('.save-btn');
      const statusEl = item.querySelector('.edit-status');
      const noteEl   = item.querySelector('.edit-note');
      const noteErr  = item.querySelector(`#editNoteError-${entry.id}`);

      const note = noteEl.value.trim();
      if (note && !Validate.maxLength(note, 200)) {
        Validate.showError(noteEl, noteErr, 'Note must be 200 characters or fewer.');
        return;
      }
      Validate.clearError(noteEl, noteErr);

      isSaving            = true;
      saveBtn.disabled    = true;
      saveBtn.textContent = 'Saving...';

      try {
        const starPickerEl = item.querySelector(`#starPicker-${entry.id}`);
        const userRating   = starPickerEl ? parseInt(starPickerEl.dataset.value) || 0 : 0;

        const updated = await WatchlistAPI.update(entry.id, {
          status: statusEl.value,
          note,
          userRating: userRating || null,
        });

        const idx = allEntries.findIndex((e) => e.id === entry.id);
        if (idx !== -1) {
          allEntries[idx] = { ...allEntries[idx], ...updated };
        }

        item.querySelector(`#editForm-${entry.id}`).classList.remove('open');
        renderList();
        Toast.success('Watchlist entry updated.');
      } catch (err) {
        Toast.error('Could not save changes: ' + err.message);
      } finally {
        isSaving            = false;
        saveBtn.disabled    = false;
        saveBtn.textContent = 'Save';
      }
    });

    item.querySelector('.delete-btn').addEventListener('click', () => {
      openDeleteModal(entry.id, entry.title);
    });

    return item;
  };

  const renderList = () => {
    let filtered = activeFilter === 'all'
      ? allEntries
      : allEntries.filter((e) => e.status === activeFilter);

    filtered = sortEntries(filtered);
    listEl.innerHTML = '';
    renderStats(allEntries);

    if (!filtered.length) {
      listEl.style.display  = 'none';
      emptyEl.style.display = 'block';
      emptyEl.querySelector('p').innerHTML =
        activeFilter === 'all'
          ? `Your watchlist is empty. <a href="../index.html" style="color:var(--gold);">Search for films</a> to get started.`
          : `No films with status <strong>${escapeHtml(activeFilter)}</strong> yet.`;
      countEl.textContent = '';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display  = 'flex';
    filtered.forEach((entry) => listEl.appendChild(buildItem(entry)));
    countEl.textContent = `${filtered.length} film${filtered.length !== 1 ? 's' : ''}`;
  };

  filterTabs.forEach((tab) => {
    if (tab.dataset.filter === activeFilter) {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    }
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      savePrefs();
      renderList();
    });
  });

  if (sortSelect) {
    sortSelect.value = activeSort;
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      savePrefs();
      renderList();
    });
  }

  const init = async () => {
    showSkeleton(5);
    loadingEl.style.display = 'none';

    try {
      allEntries = await WatchlistAPI.getAll();
      controlsEl.style.display = 'flex';
      renderStats(allEntries);

      if (!allEntries.length) {
        listEl.style.display  = 'none';
        emptyEl.style.display = 'block';
      } else {
        renderList();
      }
    } catch (err) {
      listEl.style.display  = 'none';
      errorEl.style.display = 'block';
      Toast.error('Could not load watchlist: ' + err.message);
    }
  };

  init();
})();
