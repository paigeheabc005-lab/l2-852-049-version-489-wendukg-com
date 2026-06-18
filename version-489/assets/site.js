(function () {
  const navButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');

  if (navButton && nav) {
    navButton.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.style.opacity = '0';
      image.parentElement.classList.add('image-missing');
    });
  });

  initHeroCarousel();
  initFilters();
  initPlayers();

  function initHeroCarousel() {
    const carousel = document.querySelector('[data-hero-carousel]');

    if (!carousel) {
      return;
    }

    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    function showSlide(targetIndex) {
      if (!slides.length) {
        return;
      }

      index = (targetIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5000);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.dataset.heroDot || 0));
        startTimer();
      });
    });

    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
  }

  function initFilters() {
    const lists = document.querySelectorAll('[data-filter-list]');

    lists.forEach(function (list) {
      const root = list.closest('.section-block') || document;
      const search = root.querySelector('[data-filter-search]');
      const type = root.querySelector('[data-filter-type]');
      const year = root.querySelector('[data-filter-year]');
      const reset = root.querySelector('[data-filter-reset]');
      const cards = Array.from(list.querySelectorAll('.filter-card'));

      function applyFilter() {
        const keyword = normalize(search ? search.value : '');
        const typeValue = normalize(type ? type.value : '');
        const yearValue = year ? year.value : '';

        cards.forEach(function (card) {
          const text = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(' '));
          const cardType = normalize(card.dataset.type || '');
          const cardYear = Number((card.dataset.year || '').match(/\d{4}/)?.[0] || 0);

          const matchKeyword = !keyword || text.includes(keyword);
          const matchType = !typeValue || cardType.includes(typeValue);
          const matchYear = !yearValue || cardYear >= Number(yearValue);

          card.classList.toggle('is-hidden', !(matchKeyword && matchType && matchYear));
        });
      }

      [search, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilter);
          control.addEventListener('change', applyFilter);
        }
      });

      if (reset) {
        reset.addEventListener('click', function () {
          if (search) {
            search.value = '';
          }
          if (type) {
            type.value = '';
          }
          if (year) {
            year.value = '';
          }
          applyFilter();
        });
      }
    });
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initPlayers() {
    document.querySelectorAll('[data-player-shell]').forEach(function (shell) {
      const video = shell.querySelector('video[data-src]');
      const button = shell.querySelector('[data-play-button]');
      const note = shell.parentElement.querySelector('[data-player-note]');
      let initialized = false;
      let hlsInstance = null;

      if (!video || !button) {
        return;
      }

      button.addEventListener('click', function () {
        startVideo();
      });

      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });

      function startVideo() {
        if (!initialized) {
          initialized = true;
          bindSource(video.dataset.src || '');
        }

        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            updateNote('浏览器阻止了自动播放，请再次点击视频控件播放。');
          });
        }
      }

      function bindSource(source) {
        if (!source) {
          updateNote('当前影片缺少播放源。');
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            updateNote('播放源已加载，可直接观看。');
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              updateNote('播放源加载遇到网络问题，请刷新页面后重试。');
              hlsInstance.destroy();
              hlsInstance = null;
            }
          });
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          updateNote('已使用浏览器原生 HLS 能力加载播放源。');
          return;
        }

        video.src = source;
        updateNote('当前浏览器可能需要 HLS 支持，已尝试直接加载播放源。');
      }

      function updateNote(message) {
        if (note) {
          note.textContent = message;
        }
      }

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }
})();
