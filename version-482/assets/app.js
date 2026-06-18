(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMobileNav() {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function setupHeroCarousel() {
        var root = document.querySelector("[data-hero-carousel]");
        if (!root) {
            return;
        }
        var images = Array.prototype.slice.call(root.querySelectorAll("[data-hero-image]"));
        var texts = Array.prototype.slice.call(root.querySelectorAll("[data-hero-text]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!images.length) {
                return;
            }
            index = (nextIndex + images.length) % images.length;
            images.forEach(function (item, itemIndex) {
                item.classList.toggle("is-active", itemIndex === index);
            });
            texts.forEach(function (item, itemIndex) {
                item.classList.toggle("is-active", itemIndex === index);
            });
            dots.forEach(function (item, itemIndex) {
                item.classList.toggle("is-active", itemIndex === index);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5600);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        restart();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function filterCards(query) {
        var scope = document.querySelector("[data-card-scope]");
        if (!scope) {
            return;
        }
        var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
        var empty = document.querySelector("[data-empty-state]");
        var needle = normalize(query);
        var visible = 0;
        cards.forEach(function (card) {
            var haystack = normalize(card.getAttribute("data-search") || card.textContent);
            var match = !needle || haystack.indexOf(needle) !== -1;
            card.hidden = !match;
            if (match) {
                visible += 1;
            }
        });
        if (empty) {
            empty.hidden = visible !== 0;
        }
    }

    function setupSearch() {
        Array.prototype.slice.call(document.querySelectorAll("[data-search-redirect]")).forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[type='search']");
                var action = form.getAttribute("data-action") || "search.html";
                var value = input ? input.value.trim() : "";
                var target = action;
                if (value) {
                    target += (action.indexOf("?") === -1 ? "?" : "&") + "q=" + encodeURIComponent(value);
                }
                window.location.href = target;
            });
        });

        Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]")).forEach(function (form) {
            var input = form.querySelector("[data-filter-input]");
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                filterCards(input ? input.value : "");
            });
            if (input) {
                input.addEventListener("input", function () {
                    filterCards(input.value);
                });
            }
        });

        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        var pageInput = document.querySelector("[data-filter-input]");
        if (query && pageInput) {
            pageInput.value = query;
            filterCards(query);
        }
    }

    function setupImages() {
        Array.prototype.slice.call(document.querySelectorAll("img")).forEach(function (image) {
            image.addEventListener("error", function () {
                image.classList.add("image-missing");
            });
        });
    }

    function setupPlayer() {
        var video = document.querySelector("[data-video-player]");
        var button = document.querySelector("[data-play-button]");
        if (!video || !button) {
            return;
        }
        var src = button.getAttribute("data-src") || "";
        var attached = false;
        var hls = null;

        function attachSource() {
            if (attached || !src) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = src;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    maxBufferLength: 32,
                    backBufferLength: 30
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                return;
            }
            video.src = src;
        }

        function startPlayback() {
            attachSource();
            button.classList.add("is-hidden");
            var playback = video.play();
            if (playback && typeof playback.catch === "function") {
                playback.catch(function () {
                    button.classList.remove("is-hidden");
                });
            }
        }

        button.addEventListener("click", startPlayback);
        video.addEventListener("click", function () {
            if (video.paused) {
                startPlayback();
            }
        });
        video.addEventListener("play", function () {
            button.classList.add("is-hidden");
        });
        video.addEventListener("ended", function () {
            button.classList.remove("is-hidden");
        });
        window.addEventListener("beforeunload", function () {
            if (hls && typeof hls.destroy === "function") {
                hls.destroy();
            }
        });
    }

    ready(function () {
        setupMobileNav();
        setupHeroCarousel();
        setupSearch();
        setupImages();
        setupPlayer();
    });
})();
