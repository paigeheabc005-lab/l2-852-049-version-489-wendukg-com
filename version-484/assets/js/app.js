(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  ready(function () {
    initMenu();
    initHeroSlider();
    initMovieFilters();
    initMoviePlayer();
  });

  function initMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-site-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      button.classList.toggle("is-open");
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var picks = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-pick]"));
    if (slides.length < 2) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
      picks.forEach(function (pick, pickIndex) {
        pick.classList.toggle("is-active", pickIndex === current);
      });
    }
    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        restart();
      });
    });
    picks.forEach(function (pick) {
      pick.addEventListener("mouseenter", function () {
        show(Number(pick.getAttribute("data-hero-pick")) || 0);
        restart();
      });
    });
    restart();
  }

  function initMovieFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var input = panel.querySelector("[data-movie-search]");
      var regionSelect = panel.querySelector("[data-region-select]");
      var typeSelect = panel.querySelector("[data-type-select]");
      var grid = panel.parentElement.querySelector("[data-movie-grid]");
      var empty = panel.querySelector("[data-filter-empty]");
      if (!grid) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";
      if (input && query) {
        input.value = query;
      }
      function normalize(value) {
        return String(value || "").toLowerCase().trim();
      }
      function matchRegion(card, value) {
        if (!value || value === "全部地区") {
          return true;
        }
        var region = card.getAttribute("data-region") || "";
        if (value === "欧美") {
          return /美国|英国|法国|德国|意大利|西班牙|加拿大|澳大利亚|欧洲|俄罗斯|瑞典|波兰|爱尔兰|挪威|丹麦|芬兰|比利时|荷兰|墨西哥|巴西|阿根廷|智利|哥伦比亚|古巴|秘鲁|南非/.test(region);
        }
        if (value === "华语") {
          return /中国|香港|台湾|澳门|华语/.test(region);
        }
        if (value === "日韩") {
          return /日本|韩国/.test(region);
        }
        if (value === "其他") {
          return !/美国|英国|法国|德国|意大利|西班牙|加拿大|澳大利亚|欧洲|俄罗斯|瑞典|波兰|爱尔兰|挪威|丹麦|芬兰|比利时|荷兰|墨西哥|巴西|阿根廷|智利|哥伦比亚|古巴|秘鲁|南非|中国|香港|台湾|澳门|华语|日本|韩国/.test(region);
        }
        return region.indexOf(value) !== -1;
      }
      function matchType(card, value) {
        if (!value || value === "全部类型") {
          return true;
        }
        var type = card.getAttribute("data-type") || "";
        var genre = card.getAttribute("data-genre") || "";
        return type.indexOf(value) !== -1 || genre.indexOf(value) !== -1;
      }
      function apply() {
        var needle = normalize(input ? input.value : "");
        var regionValue = regionSelect ? regionSelect.value : "全部地区";
        var typeValue = typeSelect ? typeSelect.value : "全部类型";
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags")
          ].join(" "));
          var matched = (!needle || haystack.indexOf(needle) !== -1) && matchRegion(card, regionValue) && matchType(card, typeValue);
          card.hidden = !matched;
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }
      [input, regionSelect, typeSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  function initMoviePlayer() {
    var player = document.querySelector("[data-movie-player]");
    if (!player) {
      return;
    }
    var video = player.querySelector("video");
    var startButton = player.querySelector("[data-player-start]");
    var message = player.querySelector("[data-player-message]");
    if (!video) {
      return;
    }
    var stream = video.getAttribute("data-stream");
    var hlsInstance = null;
    function showMessage(text) {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.add("is-visible");
    }
    function attachStream() {
      if (!stream || video.getAttribute("data-loaded") === "yes") {
        return;
      }
      video.setAttribute("data-loaded", "yes");
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        player.classList.add("is-ready");
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          player.classList.add("is-ready");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            showMessage("视频加载失败，请稍后再试");
          }
        });
        return;
      }
      showMessage("当前设备暂不支持播放");
    }
    function playVideo() {
      attachStream();
      var promise = video.play();
      if (promise && typeof promise.then === "function") {
        promise.then(function () {
          player.classList.add("is-playing");
          if (startButton) {
            startButton.classList.add("is-hidden");
          }
        }).catch(function () {
          showMessage("请再次点击播放");
        });
      } else {
        player.classList.add("is-playing");
      }
    }
    attachStream();
    if (startButton) {
      startButton.addEventListener("click", function (event) {
        event.preventDefault();
        playVideo();
      });
    }
    video.addEventListener("play", function () {
      player.classList.add("is-playing");
      if (startButton) {
        startButton.classList.add("is-hidden");
      }
    });
    video.addEventListener("pause", function () {
      player.classList.remove("is-playing");
    });
    video.addEventListener("error", function () {
      showMessage("视频加载失败，请稍后再试");
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }
})();
