(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const search = document.querySelector('[data-mobile-search]');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open');
      if (search) {
        search.classList.toggle('open');
      }
    });
  }

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    const show = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
        dot.setAttribute('aria-pressed', String(dotIndex === current));
      });
    };

    const start = function () {
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    };

    if (slides.length > 1) {
      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          show(index);
          start();
        });
      });
      if (prev) {
        prev.addEventListener('click', function () {
          show(current - 1);
          start();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          show(current + 1);
          start();
        });
      }
      start();
    }
  }

  const playerRoot = document.querySelector('[data-player]');
  if (playerRoot) {
    const video = playerRoot.querySelector('video');
    const videoUrl = playerRoot.getAttribute('data-video');
    const cover = playerRoot.querySelector('.player-cover');
    const errorBox = playerRoot.querySelector('.player-error');
    const playButtons = Array.from(playerRoot.querySelectorAll('[data-player-action="play"]'));
    const muteButtons = Array.from(playerRoot.querySelectorAll('[data-player-action="mute"]'));
    const fullButtons = Array.from(playerRoot.querySelectorAll('[data-player-action="fullscreen"]'));
    let attached = false;
    let hls = null;

    const setError = function (message) {
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.classList.add('visible');
      }
    };

    const attachSource = function () {
      if (attached || !video || !videoUrl) {
        return;
      }
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }
          setError('播放暂时不可用，请稍后重试');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      } else {
        setError('当前浏览器暂不支持在线播放');
      }
    };

    const refreshButtons = function () {
      const label = video && !video.paused ? '暂停' : '播放';
      playButtons.forEach(function (button) {
        button.textContent = label;
      });
      playerRoot.classList.toggle('is-playing', Boolean(video && !video.paused));
    };

    const startVideo = function () {
      attachSource();
      if (cover) {
        cover.classList.add('hidden');
      }
      if (video) {
        video.play().catch(function () {
          refreshButtons();
        });
      }
    };

    playButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (!video) {
          return;
        }
        if (video.paused) {
          startVideo();
        } else {
          video.pause();
        }
      });
    });

    muteButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (!video) {
          return;
        }
        video.muted = !video.muted;
        button.textContent = video.muted ? '开声' : '静音';
      });
    });

    fullButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (!video) {
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      });
    });

    if (cover) {
      cover.addEventListener('click', startVideo);
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', refreshButtons);
      video.addEventListener('pause', refreshButtons);
      video.addEventListener('ended', refreshButtons);
    }
  }

  const searchRoot = document.querySelector('[data-search-results]');
  if (searchRoot && typeof movieSearchIndex !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    const input = document.querySelector('[data-search-input]');
    if (input) {
      input.value = query;
    }
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = movieSearchIndex.filter(function (item) {
      if (!words.length) {
        return true;
      }
      const haystack = [item.title, item.region, item.type, item.year, item.genre, item.tags, item.oneLine].join(' ').toLowerCase();
      return words.every(function (word) {
        return haystack.includes(word);
      });
    }).slice(0, 80);

    const escapeHtml = function (value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[character];
      });
    };

    searchRoot.innerHTML = results.map(function (item) {
      return [
        '<article class="movie-card">',
        '<a href="' + escapeHtml(item.url) + '">',
        '<div class="card-media">',
        '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '<span class="card-type">' + escapeHtml(item.type) + '</span>',
        '<span class="card-year">' + escapeHtml(item.year) + '</span>',
        '<span class="play-badge">▶</span>',
        '</div>',
        '<div class="card-body">',
        '<h3>' + escapeHtml(item.title) + '</h3>',
        '<p>' + escapeHtml(item.oneLine) + '</p>',
        '<div class="card-meta">',
        '<span>' + escapeHtml(item.region) + '</span>',
        '<span>' + escapeHtml(item.genre) + '</span>',
        '</div>',
        '</div>',
        '</a>',
        '</article>'
      ].join('');
    }).join('');

    if (!results.length) {
      searchRoot.innerHTML = '<div class="content-panel"><p>没有匹配内容，换一个关键词试试。</p></div>';
    }
  }
})();
