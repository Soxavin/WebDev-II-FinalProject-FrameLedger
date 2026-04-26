// ui.js - Shared UI helpers used across all pages.


const Toast = (() => {
  let container;

  const init = () => {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  };

  const show = (message, type = 'default', duration = 3000) => {
    if (!container) init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.25s ease forwards';
      setTimeout(() => toast.remove(), 260);
    }, duration);
  };

  return {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error', 4000), // errors stay longer
    info:    (msg) => show(msg, 'default'),
  };
})();


const Spinner = {
  show: (container, message = 'Loading...') => {
    container.innerHTML = `
      <div class="state-message">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>`;
  },
  hide: (container) => {
    const el = container.querySelector('.state-message');
    if (el) el.remove();
  },
};


const StateMessage = {
  show: (container, icon, message) => {
    container.innerHTML = `
      <div class="state-message">
        <div class="state-message__icon">${icon}</div>
        <p>${message}</p>
      </div>`;
  },
};


// returns an <a> element ready to append to a grid
const buildMovieCard = (movie, linkPrefix = 'pages/movie.html') => {
  // w342 is a good balance of quality vs file size for grid cards
  const posterPath = TMDB.posterUrl(movie.poster_path, 'w342');

  // date comes back as '2023-07-15' — we only want the year part
  const year = movie.release_date
    ? movie.release_date.substring(0, 4)
    : '-';

  // Only show a rating if the film has actual votes - 0.0 with no votes is misleading
  const rating = movie.vote_count > 0 && movie.vote_average != null
    ? movie.vote_average.toFixed(1)
    : '-';

  // whole card is a link — pass ?q= so the back button can restore the search
  const card = document.createElement('a');
  card.className = 'movie-card';
  const currentQ = new URLSearchParams(window.location.search).get('q') || '';
  const qParam   = currentQ ? `&q=${encodeURIComponent(currentQ)}` : '';
  card.href = `${linkPrefix}?id=${movie.id}${qParam}`;

  card.innerHTML = `
    ${posterPath
      ? `<img class="movie-card__poster" src="${posterPath}" alt="${escapeHtml(movie.title)}" loading="lazy">`
      : `<div class="movie-card__poster-placeholder"></div>`
    }
    <div class="movie-card__body">
      <div class="movie-card__title">${escapeHtml(movie.title)}</div>
      <div class="movie-card__meta">
        <span class="movie-card__year">${year}</span>
        <span class="movie-card__rating">★ ${rating}</span>
      </div>
    </div>`;

  return card;
};


// form validation helpers
const Validate = {
  required: (value) => value.trim().length > 0,
  maxLength: (value, max) => value.trim().length <= max,

  showError: (fieldEl, errorEl, message) => {
    fieldEl.classList.add('error');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  },

  clearError: (fieldEl, errorEl) => {
    fieldEl.classList.remove('error');
    errorEl.classList.remove('visible');
  },

  // reset all field errors before re-running validation
  clearAll: (formEl) => {
    formEl.querySelectorAll('.form-control').forEach((f) => f.classList.remove('error'));
    formEl.querySelectorAll('.field-error').forEach((e) => e.classList.remove('visible'));
  },
};


const statusBadge = (status) => {
  const map = {
    'Want to Watch': 'want',
    'Watching':      'watching',
    'Completed':     'completed',
  };
  const cls = map[status] || 'want';
  return `<span class="status-badge status-badge--${cls}">${escapeHtml(status)}</span>`;
};


const setActiveNav = () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach((link) => {
    // Strip query params before comparing so 'index.html?mode=discover' still matches
    const href = link.getAttribute('href').split('?')[0].split('/').pop();
    if (href === page) link.classList.add('active');
  });
};


// run any API or user text through this before putting it into innerHTML to prevent XSS
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
};


const truncate = (str, max) =>
  str && str.length > max ? str.substring(0, max) + '…' : str;


const getParam = (key) => new URLSearchParams(window.location.search).get(key);


document.addEventListener('DOMContentLoaded', setActiveNav);
