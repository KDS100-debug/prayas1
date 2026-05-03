(function () {
  const MENU_SELECTOR = '.nav-links, .nav-menu';
  const TEXT_CORRECTIONS = [
    { pattern: /\bHUNPAN\b/g, replacement: 'SOPAN' },
    { pattern: /\bHunpan\b/g, replacement: 'Sopan' },
    { pattern: /\bhunpan\b/g, replacement: 'sopan' },
    { pattern: /\bXI-SCIENCEI\b/gi, replacement: 'XI-SCIENCE' }
  ];

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

  function correctText(value) {
    return TEXT_CORRECTIONS.reduce(
      (current, rule) => current.replace(rule.pattern, rule.replacement),
      value
    );
  }

  function applyTextCorrections(root = document.body) {
    if (!root) return;

    const blockedTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || blockedTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const corrected = correctText(node.nodeValue);
      if (corrected !== node.nodeValue) node.nodeValue = corrected;
    });

    root.querySelectorAll('[alt], [title], [aria-label]').forEach((element) => {
      ['alt', 'title', 'aria-label'].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;
        const corrected = correctText(value);
        if (corrected !== value) element.setAttribute(attribute, corrected);
      });
    });
  }

  function observeTextCorrections() {
    applyTextCorrections();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const corrected = correctText(node.nodeValue);
            if (corrected !== node.nodeValue) node.nodeValue = corrected;
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            applyTextCorrections(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    document.querySelectorAll('.navbar, .topbar, header nav, nav').forEach(enhanceNavbar);
    wrapTables();
    normalizeMedia();
    enhanceForms();
    observeTextCorrections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
