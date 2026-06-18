const menuToggle = document.querySelector('.menu-toggle');
const mobilePanel = document.querySelector('.mobile-panel');

if (menuToggle && mobilePanel) {
  menuToggle.addEventListener('click', () => {
    const open = mobilePanel.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    mobilePanel.setAttribute('aria-hidden', String(!open));
  });
}

const carousel = document.querySelector('[data-carousel]');

if (carousel) {
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  const dots = [...carousel.querySelectorAll('[data-dot]')];
  let current = 0;
  let timer = null;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  const start = () => {
    timer = window.setInterval(() => showSlide(current + 1), 5200);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
    }
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stop();
      showSlide(index);
      start();
    });
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  start();
}

const cards = [...document.querySelectorAll('[data-movie-card]')];
const searchInputs = [...document.querySelectorAll('[data-filter-input]')];
const yearSelects = [...document.querySelectorAll('[data-filter-year]')];
const typeSelects = [...document.querySelectorAll('[data-filter-type]')];
const emptyState = document.querySelector('[data-empty-state]');

const params = new URLSearchParams(window.location.search);
const initialQuery = params.get('q') || '';

searchInputs.forEach((input) => {
  if (initialQuery) {
    input.value = initialQuery;
  }
});

const normalize = (value) => String(value || '').trim().toLowerCase();

function applyFilters() {
  if (!cards.length) {
    return;
  }

  const query = normalize(searchInputs[0]?.value);
  const year = normalize(yearSelects[0]?.value);
  const type = normalize(typeSelects[0]?.value);
  let visible = 0;

  cards.forEach((card) => {
    const text = normalize([
      card.textContent,
      card.dataset.title,
      card.dataset.tags,
      card.dataset.region,
      card.dataset.year,
      card.dataset.type
    ].join(' '));
    const matchQuery = !query || text.includes(query);
    const matchYear = !year || normalize(card.dataset.year) === year;
    const matchType = !type || normalize(card.dataset.type) === type;
    const show = matchQuery && matchYear && matchType;
    card.hidden = !show;
    if (show) {
      visible += 1;
    }
  });

  if (emptyState) {
    emptyState.hidden = visible !== 0;
  }
}

[...searchInputs, ...yearSelects, ...typeSelects].forEach((control) => {
  control.addEventListener('input', applyFilters);
  control.addEventListener('change', applyFilters);
});

applyFilters();
