(function () {
  const MENU_SELECTOR = '.nav-links, .nav-menu';

  function createToggle() {
    const button = document.createElement('button');
    button.className = 'site-menu-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open navigation menu');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span><span></span><span></span>';
    return button;
  }

  function enhanceNavbar(navbar) {
    const menu = navbar.querySelector(MENU_SELECTOR);
    if (!menu) return;

    let toggle = navbar.querySelector('.site-menu-toggle, .nav-toggle');
    if (!toggle) {
      toggle = createToggle();
      const brand = navbar.querySelector('.logo, .brand, .nav-logo-section, h1');
      if (brand && brand.parentNode === navbar) {
        brand.insertAdjacentElement('afterend', toggle);
      } else {
        navbar.insertBefore(toggle, menu);
      }
    }

    const menuId = menu.id || `site-menu-${Math.random().toString(36).slice(2, 9)}`;
    menu.id = menuId;
    toggle.setAttribute('aria-controls', menuId);
    toggle.setAttribute('aria-expanded', menu.classList.contains('active') ? 'true' : 'false');
    const isExistingToggle = toggle.classList.contains('nav-toggle');

    const setOpen = (open) => {
      navbar.classList.toggle('is-menu-open', open);
      menu.classList.toggle('is-open', open);
      if (isExistingToggle) {
        menu.classList.toggle('active', open);
        toggle.classList.toggle('active', open);
      } else {
        toggle.classList.toggle('is-active', open);
      }
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    };

    if (!toggle.dataset.responsiveBound) {
      toggle.addEventListener('click', () => {
        if (isExistingToggle) {
          requestAnimationFrame(() => {
            setOpen(menu.classList.contains('active') || toggle.classList.contains('active'));
          });
          return;
        }

        setOpen(!navbar.classList.contains('is-menu-open'));
      });
      toggle.dataset.responsiveBound = 'true';
    }

    menu.querySelectorAll('a').forEach((link) => {
      if (link.dataset.responsiveBound) return;
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          setOpen(false);
        }
      });
      link.dataset.responsiveBound = 'true';
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  function wrapTables() {
    document.querySelectorAll('table').forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains('table-scroll')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function normalizeMedia() {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = img.loading || 'lazy';
      img.decoding = img.decoding || 'async';
    });

    document.querySelectorAll('iframe').forEach((iframe) => {
      iframe.loading = iframe.loading || 'lazy';
      iframe.setAttribute('title', iframe.getAttribute('title') || 'Embedded content');
    });
  }

  function enhanceForms() {
    document.querySelectorAll('input, select, textarea, button, a').forEach((element) => {
      if (element.tagName === 'A' && !element.getAttribute('href')) return;
      element.classList.add('touch-target');
    });
  }

  function init() {
    document.querySelectorAll('.navbar, .topbar, header nav, nav').forEach(enhanceNavbar);
    wrapTables();
    normalizeMedia();
    enhanceForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
