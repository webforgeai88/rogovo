const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const themePicker = document.querySelector('.theme-picker');
const themeToggle = themePicker.querySelector('summary');
const themeButtons = [...themePicker.querySelectorAll('[data-palette]')];
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeKey = 'rogovo-demo-palette';

function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  const activeTheme = getComputedStyle(document.documentElement);
  themeColor.content = activeTheme.getPropertyValue('--header-bg').trim();
  for (const button of themeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.palette === value));
  }
}

let initialTheme = 'warm';
try {
  const saved = localStorage.getItem(themeKey);
  if (themeButtons.some(button => button.dataset.palette === saved)) initialTheme = saved;
} catch {
  // A theme can still be selected for this visit.
}
applyTheme(initialTheme);
themePicker.hidden = false;

themePicker.addEventListener('click', (event) => {
  const button = event.target.closest('[data-palette]');
  if (!button) return;
  const choice = button.dataset.palette;
  applyTheme(choice);
  themePicker.open = false;
  themeToggle.focus();
  try {
    localStorage.setItem(themeKey, choice);
  } catch {
    // Storage can be disabled for local files.
  }
});

document.addEventListener('click', (event) => {
  if (themePicker.open && !themePicker.contains(event.target)) themePicker.open = false;
});

themePicker.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !themePicker.open) return;
  themePicker.open = false;
  themeToggle.focus();
  event.stopPropagation();
});

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Закрыть' : 'Меню';
}

menu.hidden = false;
menu.addEventListener('click', () => {
  setMenu(menu.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    if (link.hash) document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});

matchMedia('(min-width: 761px)').addEventListener('change', () => setMenu(false));

const motionPreference = matchMedia('(prefers-reduced-motion: no-preference)');

function revealHeading(heading) {
  if (typeof heading.animate !== 'function') return false;
  const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
  const height = heading.getBoundingClientRect().height;
  if (!lineHeight || !height) return false;

  // Reveal the rendered lines without inserting spans that could change wrapping.
  const lines = Math.max(1, Math.round(height / lineHeight));
  const frames = [{ clipPath: 'inset(-.15em -.2em 100% -.2em)', translate: '0 10px', offset: 0 }];
  const pause = .04 / lines;
  for (let line = 1; line <= lines; line++) {
    const offset = line / lines;
    const clipPath = `inset(-.15em -.2em ${line === lines ? '-.22em' : `${100 * (1 - offset)}%`} -.2em)`;
    const frame = { clipPath, translate: `0 ${10 * (1 - offset)}px` };
    if (line < lines) frames.push({ ...frame, offset: offset - pause });
    frames.push({ ...frame, offset });
  }
  const effect = heading.animate(frames, { duration: 300 + 85 * lines, easing: 'ease-out' });
  const stop = (event) => { if (!event.matches) effect.cancel(); };
  motionPreference.addEventListener('change', stop);
  const cleanup = () => motionPreference.removeEventListener('change', stop);
  effect.addEventListener('finish', cleanup, { once: true });
  effect.addEventListener('cancel', cleanup, { once: true });
  return true;
}

if ('IntersectionObserver' in window && motionPreference.matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      if (!motionPreference.matches) continue;
      if (element.matches('h2') && revealHeading(element)) continue;
      element.classList.add('revealed');
    }
  }, { threshold: 0.08 });

  document.querySelectorAll([
    '.story h2',
    '[data-reveal] > :is(h3, p)',
    '.product-header .editorial-label',
    '.story figure:not(.herd-film)',
    '.editorial-timeline h3',
    '.editorial-timeline li',
    '.editorial-facts li',
    '.editorial-stories .article-copy',
    '.food-story .article-copy',
    '.food-notes p',
    '.footer-main h2',
    '.footer-main .article-copy',
    '.footer-main address',
  ].join(',')).forEach((element) => observer.observe(element));
}
