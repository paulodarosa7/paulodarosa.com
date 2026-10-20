'use strict';

// Interações locais. O conteúdo e os links principais estão no HTML.
document.documentElement.classList.replace('no-js', 'js');

const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
function updateThemeControls() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
  themeButton.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
  themeMeta.content = dark ? '#142019' : '#f3f4ef';
}
updateThemeControls();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('paulo-theme', root.dataset.theme); } catch (_) { /* Sem armazenamento, o tema continua funcionando nesta visita. */ }
  updateThemeControls();
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu({ restoreFocus = false } = {}) {
  const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  nav.classList.remove('is-open');
  if (wasOpen && restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  nav.classList.toggle('is-open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu({ restoreFocus: true });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header-inner')) closeMenu();
});
window.matchMedia('(min-width: 721px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const layerDescriptions = {
  infra: 'Servidores, virtualização e redes: a base para manter os serviços funcionando.',
  orchestration: 'Containers, réplicas e filas: organizando a execução das aplicações.',
  observability: 'Métricas, sinais e contexto: entendendo o comportamento de cada serviço.'
};
document.querySelectorAll('[data-layer-select]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.hero-visual').dataset.layer = button.dataset.layerSelect;
    document.querySelectorAll('[data-layer-select]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('.layer-description').textContent = layerDescriptions[button.dataset.layerSelect];
  });
});

const projectCards = [...document.querySelectorAll('[data-project]')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const search = document.querySelector('#project-search');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const searchIndex = new Map(projectCards.map(card => [card, normalize(`${card.dataset.search} ${card.textContent}`)]));
let activeFilter = 'all';
function filterProjects() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const card of projectCards) {
    const inCategory = activeFilter === 'all' || card.dataset.categories.split(' ').includes(activeFilter);
    const matches = terms.every(term => searchIndex.get(card).includes(term));
    card.hidden = !(inCategory && matches);
    if (!card.hidden) visible += 1;
  }
  document.querySelector('#project-count').textContent = `${visible} ${visible === 1 ? 'projeto' : 'projetos'}${activeFilter !== 'all' || terms.length ? (visible === 1 ? ' encontrado' : ' encontrados') : ''}`;
  document.querySelector('#empty-projects').hidden = visible > 0;
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  filterProjects();
}));
search.addEventListener('input', filterProjects);
filterProjects();
document.querySelector('#reset-projects').addEventListener('click', () => {
  activeFilter = 'all';
  search.value = '';
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
  filterProjects();
  search.focus();
});

const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');
let previousFocus = null;
document.querySelectorAll('[data-dialog-target]').forEach(button => button.addEventListener('click', () => {
  const template = document.querySelector(`#project-${button.dataset.dialogTarget}`);
  if (!template) return;
  previousFocus = button;
  dialogContent.replaceChildren(template.content.cloneNode(true));
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.scrollTop = 0;
  dialog.querySelector('.dialog-close').focus();
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (event.target === dialog && outside) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  previousFocus?.focus();
});

let toastTimer;
function announce(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}
document.querySelector('#copy-profile').addEventListener('click', async () => {
  const url = 'https://github.com/paulodarosa7';
  try {
    await navigator.clipboard.writeText(url);
    announce('Link do GitHub copiado.');
  } catch (_) {
    announce('Não foi possível copiar automaticamente. O endereço é github.com/paulodarosa7.');
  }
});

document.querySelector('#year').textContent = String(new Date().getFullYear());
if ('IntersectionObserver' in window) {
  const navLinks = [...nav.querySelectorAll('a')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-10% 0px -70% 0px' });
  navLinks.forEach(link => { const section = document.querySelector(link.getAttribute('href')); if (section) observer.observe(section); });
}
