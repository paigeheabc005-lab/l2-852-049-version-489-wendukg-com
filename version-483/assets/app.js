(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var button = document.querySelector('[data-mobile-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    selectAll('[data-hero]').forEach(function (hero) {
      var slides = selectAll('[data-hero-slide]', hero);
      var dots = selectAll('[data-hero-dot]', hero);
      var prev = hero.querySelector('[data-hero-prev]');
      var next = hero.querySelector('[data-hero-next]');
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === index);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          start();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          start();
        });
      }
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
          start();
        });
      });
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
      show(0);
      start();
    });
  }

  function setupScrollRows() {
    selectAll('.scroll-section').forEach(function (section) {
      var row = section.querySelector('[data-scroll-row]');
      var left = section.querySelector('[data-scroll-left]');
      var right = section.querySelector('[data-scroll-right]');
      if (!row) {
        return;
      }
      if (left) {
        left.addEventListener('click', function () {
          row.scrollBy({ left: -420, behavior: 'smooth' });
        });
      }
      if (right) {
        right.addEventListener('click', function () {
          row.scrollBy({ left: 420, behavior: 'smooth' });
        });
      }
    });
  }

  function setupPlayers() {
    selectAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var cover = player.querySelector('.player-cover');
      var source = player.getAttribute('data-stream');
      var prepared = false;
      var requested = false;
      var hls = null;

      if (!video || !source) {
        return;
      }

      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            video.muted = true;
            video.play().catch(function () {});
          });
        }
      }

      function prepare() {
        if (prepared) {
          return;
        }
        prepared = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          if (requested) {
            playVideo();
          }
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            if (requested) {
              playVideo();
            }
          });
          player._hls = hls;
          return;
        }
        video.src = source;
      }

      function startPlayback() {
        requested = true;
        if (cover) {
          cover.classList.add('is-hidden');
        }
        prepare();
        playVideo();
      }

      if (cover) {
        cover.addEventListener('click', startPlayback);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener('play', function () {
        if (cover) {
          cover.classList.add('is-hidden');
        }
      });
    });
  }

  function cardTemplate(movie) {
    return [
      '<article class="video-card">',
      '<a href="' + movie.url + '" class="video-card-link" aria-label="' + escapeHtml(movie.title) + '">',
      '<span class="video-cover-wrap">',
      '<img class="video-card-cover" src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="video-duration">' + escapeHtml(movie.duration) + '</span>',
      '</span>',
      '<span class="video-card-content">',
      '<strong class="video-card-title">' + escapeHtml(movie.title) + '</strong>',
      '<span class="video-card-description">' + escapeHtml(movie.oneLine) + '</span>',
      '<span class="video-card-meta"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.year) + '</span></span>',
      '</span>',
      '</a>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function setupSearch() {
    var results = document.getElementById('search-results');
    var input = document.getElementById('search-query');
    var status = document.getElementById('search-status');
    var form = document.querySelector('[data-search-form]');
    var data = window.SITE_MOVIES || [];
    if (!results || !input || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var firstQuery = params.get('q') || '';
    input.value = firstQuery;

    function render(query) {
      var normalized = query.trim().toLowerCase();
      var list = normalized
        ? data.filter(function (movie) {
            return [movie.title, movie.oneLine, movie.category, movie.genre, movie.year, movie.region, movie.tags].join(' ').toLowerCase().indexOf(normalized) !== -1;
          })
        : data.slice(0, 60);
      results.innerHTML = list.slice(0, 240).map(cardTemplate).join('');
      if (status) {
        status.textContent = normalized ? '匹配影片：' + list.length : '热门影片推荐';
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var query = input.value.trim();
        var url = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
        window.history.replaceState(null, '', url);
        render(query);
      });
    }
    input.addEventListener('input', function () {
      render(input.value);
    });
    render(firstQuery);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHero();
    setupScrollRows();
    setupPlayers();
    setupSearch();
  });
})();
