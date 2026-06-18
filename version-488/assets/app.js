(function () {
  var hlsLoader = null;
  var hlsUrl = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (!hlsLoader) {
      hlsLoader = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = hlsUrl;
        script.async = true;
        script.onload = function () {
          resolve(window.Hls);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    return hlsLoader;
  }

  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      var opened = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilter() {
    var input = document.querySelector(".page-filter");
    var targets = Array.prototype.slice.call(document.querySelectorAll(".filter-targets [data-search], .rank-list [data-search]"));

    if (!input || !targets.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";

    if (q) {
      input.value = q;
    }

    function apply() {
      var value = input.value.trim().toLowerCase();

      targets.forEach(function (item) {
        var text = (item.getAttribute("data-search") || item.textContent || "").toLowerCase();
        item.classList.toggle("is-hidden-by-filter", value && text.indexOf(value) === -1);
      });
    }

    input.addEventListener("input", apply);
    apply();
  }

  function attachSource(video, source) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return Promise.resolve();
    }

    return loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        if (video._hlsInstance) {
          video._hlsInstance.destroy();
        }

        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        video._hlsInstance = hls;
        hls.loadSource(source);
        hls.attachMedia(video);
        return;
      }

      video.src = source;
    });
  }

  function startPlayer(shell) {
    var video = shell.querySelector("video");

    if (!video) {
      return;
    }

    var source = video.getAttribute("data-stream");

    if (!source) {
      return;
    }

    var run = video.getAttribute("data-ready") === "true"
      ? Promise.resolve()
      : attachSource(video, source).then(function () {
        video.setAttribute("data-ready", "true");
      });

    run.then(function () {
      shell.classList.add("is-playing");
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }).catch(function () {});
  }

  function initPlayers() {
    var shells = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    shells.forEach(function (shell) {
      var button = shell.querySelector(".player-start");
      var video = shell.querySelector("video");

      if (button) {
        button.addEventListener("click", function () {
          startPlayer(shell);
        });
      }

      if (video) {
        video.addEventListener("play", function () {
          shell.classList.add("is-playing");
        });
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilter();
    initPlayers();
  });
})();
