(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
      return;
    }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function initMenu() {
    var button = document.querySelector('.menu-toggle');
    var nav = document.getElementById('mobileNav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      button.textContent = isOpen ? '×' : '☰';
    });
  }

  function initHero() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }
    function start() {
      if (timer || slider.getAttribute('data-autoplay') !== 'true') {
        return;
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        stop();
        start();
      });
    });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function textOf(card) {
    return [
      card.getAttribute('data-title'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-category'),
      card.textContent
    ].join(' ').toLowerCase();
  }

  function applyFilters(input, select, cards, empty) {
    var keyword = input ? input.value.trim().toLowerCase() : '';
    var selected = select ? select.value.trim().toLowerCase() : '';
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = textOf(card);
      var type = (card.getAttribute('data-type') || '').toLowerCase();
      var category = (card.getAttribute('data-category') || '').toLowerCase();
      var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
      var selectedMatch = !selected || type.indexOf(selected) !== -1 || category.indexOf(selected) !== -1 || haystack.indexOf(selected) !== -1;
      var matched = keywordMatch && selectedMatch;
      card.hidden = !matched;
      if (matched) {
        visible += 1;
      }
    });
    if (empty) {
      empty.hidden = visible !== 0;
    }
  }

  function initFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.filter-targets .js-movie-card'));
    if (!cards.length) {
      return;
    }
    var input = document.querySelector('.local-filter') || document.querySelector('.global-search-input');
    var select = document.querySelector('.local-type-filter') || document.querySelector('.global-category-filter');
    var empty = document.querySelector('.empty-state');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');
    if (input && query) {
      input.value = query;
    }
    if (input) {
      input.addEventListener('input', function () {
        applyFilters(input, select, cards, empty);
      });
    }
    if (select) {
      select.addEventListener('change', function () {
        applyFilters(input, select, cards, empty);
      });
    }
    applyFilters(input, select, cards, empty);
  }

  function initPlayer() {
    var shell = document.querySelector('.player-shell');
    if (!shell) {
      return;
    }
    var video = shell.querySelector('video');
    var button = shell.querySelector('.play-overlay');
    var source = shell.getAttribute('data-src');
    var loadingPromise = null;
    var hls = null;
    if (!video || !source) {
      return;
    }
    function loadSource() {
      if (loadingPromise) {
        return loadingPromise;
      }
      loadingPromise = new Promise(function (resolve) {
        if (window.Hls && window.Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal || !hls) {
              return;
            }
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
              hls = null;
            }
          });
          window.setTimeout(resolve, 1000);
        } else {
          video.src = source;
          video.addEventListener('loadedmetadata', resolve, { once: true });
          window.setTimeout(resolve, 700);
        }
      });
      return loadingPromise;
    }
    function playVideo() {
      var playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function () {});
      }
    }
    function startPlayback() {
      shell.classList.add('is-started');
      var promise = loadSource();
      playVideo();
      promise.then(function () {
        if (video.paused) {
          playVideo();
        }
      });
    }
    if (button) {
      button.addEventListener('click', startPlayback);
    }
    video.addEventListener('click', function () {
      if (!loadingPromise) {
        startPlayback();
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayer();
  });
})();
