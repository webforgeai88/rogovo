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

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach((section) => observer.observe(section));
}
