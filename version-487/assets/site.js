(function () {
  var nav = document.getElementById("navLinks");
  var menu = document.getElementById("menuToggle");

  if (menu && nav) {
    menu.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var filterInput = document.getElementById("pageFilter");
  var yearFilter = document.getElementById("yearFilter");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

  function readParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  if (filterInput && readParam("q")) {
    filterInput.value = readParam("q");
  }

  function applyFilter() {
    var keyword = filterInput ? filterInput.value.trim().toLowerCase() : "";
    var year = yearFilter ? yearFilter.value : "";

    cards.forEach(function (card) {
      var haystack = [
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-year")
      ].join(" ").toLowerCase();
      var cardYear = card.getAttribute("data-year") || "";
      var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
      var matchedYear = !year || cardYear === year;
      card.classList.toggle("is-filter-hidden", !(matchedKeyword && matchedYear));
    });
  }

  if (filterInput) {
    filterInput.addEventListener("input", applyFilter);
    applyFilter();
  }

  if (yearFilter) {
    yearFilter.addEventListener("change", applyFilter);
  }
})();

function initMoviePlayer(source, videoId, coverId) {
  var video = document.getElementById(videoId);
  var cover = document.getElementById(coverId);
  var hls = null;
  var attached = false;

  if (!video || !cover || !source) {
    return;
  }

  function attachSource() {
    if (attached) {
      return Promise.resolve();
    }

    attached = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return Promise.resolve();
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      return new Promise(function (resolve) {
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
      });
    }

    video.src = source;
    return Promise.resolve();
  }

  function playVideo() {
    cover.classList.add("is-hidden");
    attachSource().then(function () {
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          cover.classList.remove("is-hidden");
        });
      }
    });
  }

  cover.addEventListener("click", playVideo);
  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    }
  });
  video.addEventListener("play", function () {
    cover.classList.add("is-hidden");
  });
  video.addEventListener("ended", function () {
    if (hls && typeof hls.stopLoad === "function") {
      hls.stopLoad();
    }
  });
}
