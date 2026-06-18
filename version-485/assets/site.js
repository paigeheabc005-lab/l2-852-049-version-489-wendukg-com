const SitePlayer = {
    init(videoId, overlayId, source) {
        const video = document.getElementById(videoId);
        const overlay = document.getElementById(overlayId);
        if (!video || !source) {
            return;
        }

        let hls = null;

        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else {
            video.src = source;
        }

        const startPlayback = () => {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        };

        if (overlay) {
            overlay.addEventListener('click', startPlayback);
        }

        video.addEventListener('click', () => {
            if (video.paused) {
                startPlayback();
            }
        });

        video.addEventListener('play', () => {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });

        window.addEventListener('pagehide', () => {
            if (hls) {
                hls.destroy();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('.mobile-toggle');
    const panel = document.querySelector('.mobile-panel');

    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isOpen));
            panel.hidden = isOpen;
        });
    }

    const hero = document.querySelector('[data-hero]');
    if (hero) {
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        const prev = hero.querySelector('[data-hero-prev]');
        const next = hero.querySelector('[data-hero-next]');
        let index = 0;
        let timer = null;

        const show = (nextIndex) => {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
            dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
        };

        const restart = () => {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(() => show(index + 1), 5200);
        };

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                show(i);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', () => {
                show(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', () => {
                show(index + 1);
                restart();
            });
        }

        restart();
    }

    const filter = document.querySelector('.card-filter');
    const filterGrid = document.querySelector('.filterable-grid');

    if (filter && filterGrid) {
        const cards = Array.from(filterGrid.querySelectorAll('.movie-card'));
        filter.addEventListener('input', () => {
            const query = filter.value.trim().toLowerCase();
            cards.forEach((card) => {
                const text = (card.dataset.search || '').toLowerCase();
                card.hidden = query.length > 0 && !text.includes(query);
            });
        });
    }

    const searchForm = document.querySelector('[data-search-form]');
    const searchResults = document.querySelector('[data-search-results]');
    const searchStatus = document.querySelector('[data-search-status]');

    if (searchForm && searchResults && searchStatus && Array.isArray(window.SEARCH_MOVIES)) {
        const input = searchForm.querySelector('input[name="q"]');
        const params = new URLSearchParams(window.location.search);
        const startQuery = params.get('q') || '';

        const render = (query) => {
            const normalized = query.trim().toLowerCase();
            searchResults.innerHTML = '';

            if (!normalized) {
                searchStatus.textContent = '输入关键词开始搜索';
                return;
            }

            const results = window.SEARCH_MOVIES.filter((item) => item.text.toLowerCase().includes(normalized)).slice(0, 120);
            searchStatus.textContent = results.length ? `找到 ${results.length} 个相关内容` : '未找到相关内容';

            const html = results.map((item) => `
                <article class="movie-card">
                    <a class="movie-poster" href="${item.url}" aria-label="${escapeHtml(item.title)}">
                        <img src="${item.cover}" alt="${escapeHtml(item.title)}" loading="lazy">
                        <span class="poster-gradient"></span>
                        <span class="movie-badge">${escapeHtml(item.type)}</span>
                        <span class="movie-year">${escapeHtml(item.year)}</span>
                        <span class="poster-play">▶</span>
                    </a>
                    <div class="movie-card-body">
                        <h3><a href="${item.url}">${escapeHtml(item.title)}</a></h3>
                        <p>${escapeHtml(item.oneLine)}</p>
                        <div class="movie-meta-line">
                            <span>${escapeHtml(item.region)}</span>
                            <span>${escapeHtml(item.genre)}</span>
                        </div>
                    </div>
                </article>`).join('');

            searchResults.innerHTML = html;
        };

        if (input) {
            input.value = startQuery;
        }

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = input ? input.value : '';
            const nextUrl = query.trim() ? `${window.location.pathname}?q=${encodeURIComponent(query.trim())}` : window.location.pathname;
            window.history.replaceState(null, '', nextUrl);
            render(query);
        });

        render(startQuery);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        }[character]));
    }
});
