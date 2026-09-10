/**
 * Reusable UI components.
 * Header, loading/error/empty states, toasts, modals, and dashboard sidebar.
 */

import { createEl, clearEl, classNames } from './utils.js';
import config from './config.js';
import state from './state.js';

/* ---------- Header ---------- */

export function renderPublicHeader(container, settings = {}) {
  clearEl(container);
  const title = settings.siteTitle || config.APP_NAME;

  const inner = createEl('div', { class: 'container header-inner' }, [
    createEl('a', { href: 'index.html', class: 'brand' }, [
      createEl('span', { class: 'brand-mark' }, ['PH']),
      createEl('span', { text: title }),
    ]),
    createEl('div', { class: 'header-actions' }, [
      createEl('a', { href: 'login.html', class: 'btn btn-secondary btn-sm' }, ['Owner Login']),
    ]),
  ]);

  container.appendChild(inner);
}

export function renderAdminHeader(container, user = {}) {
  clearEl(container);
  const initials = String(user.name || user.email || 'O')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inner = createEl('div', { class: 'container header-inner' }, [
    createEl('a', { href: 'index.html', class: 'brand' }, [
      createEl('span', { class: 'brand-mark' }, ['PH']),
      createEl('span', { text: config.APP_NAME }),
    ]),
    createEl('div', { class: 'header-actions' }, [
      createEl('a', { href: 'dashboard.html', class: 'btn btn-ghost btn-sm' }, ['Dashboard']),
      createEl('div', { class: 'user-pill' }, [
        createEl('span', { class: 'avatar' }, [initials]),
        createEl('span', { text: user.name || user.email || 'Owner' }),
      ]),
    ]),
  ]);

  container.appendChild(inner);
}

/* ---------- Loading / Empty / Error ---------- */

export function renderLoading(container, message = 'Loading…') {
  clearEl(container);
  container.appendChild(
    createEl('div', { class: 'loading-state' }, [
      createEl('span', { class: 'spinner mb-4' }),
      createEl('p', { text: message }),
    ])
  );
}

export function renderEmpty(container, message = 'Nothing here yet.') {
  clearEl(container);
  container.appendChild(
    createEl('div', { class: 'empty-state' }, [
      createEl(
        'svg',
        {
          class: 'empty-state-icon',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        },
        [
          createEl('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }),
          createEl('path', { d: 'M3 9h18M9 21V9' }),
        ]
      ),
      createEl('h3', { text: 'No results' }),
      createEl('p', { text: message }),
    ])
  );
}

export function renderError(container, message = 'Something went wrong.', onRetry = null) {
  clearEl(container);
  const children = [
    createEl(
      'svg',
      {
        class: 'error-state-icon',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5',
      },
      [
        createEl('circle', { cx: '12', cy: '12', r: '10' }),
        createEl('path', { d: 'm15 9-6 6M9 9l6 6' }),
      ]
    ),
    createEl('h3', { text: 'Error' }),
    createEl('p', { text: message }),
  ];

  if (onRetry) {
    children.push(createEl('button', { class: 'btn btn-secondary', onClick: onRetry }, ['Try again']));
  }

  container.appendChild(createEl('div', { class: 'error-state' }, children));
}

/* ---------- Toast ---------- */

export function renderToast(message, type = 'info', duration = config.UI.TOAST_DURATION_MS) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = createEl(
    'div',
    { class: classNames('toast', type), role: 'status' },
    [createEl('span', { text: message })]
  );

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

/* ---------- Modal ---------- */

export function openModal({ title = '', content, actions = [], onClose = null, size = '' }) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  const close = () => {
    root.classList.remove('open');
    clearEl(root);
    if (onClose) onClose();
  };

  const card = createEl('div', {
    class: classNames('modal-card', size),
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title',
  });

  const header = createEl('div', { class: 'modal-header' }, [
    createEl('h2', { id: 'modal-title', class: 'modal-title', text: title }),
    createEl(
      'button',
      {
        class: 'modal-close',
        'aria-label': 'Close dialog',
        onClick: close,
      },
      ['✕']
    ),
  ]);

  const body = createEl('div', { class: 'modal-body' });
  if (content) body.appendChild(content);

  const footer = createEl('div', { class: 'modal-footer' });
  actions.forEach((action) => {
    const btn = createEl(
      'button',
      {
        class: classNames('btn', action.className || 'btn-secondary'),
        text: action.label,
        onClick: async (e) => {
          if (action.destructive) {
            const ok = await confirmDialog(action.confirmText || 'Are you sure?');
            if (!ok) return;
          }
          await action.onClick(e);
          if (action.close !== false) close();
        },
      },
      [action.label]
    );
    footer.appendChild(btn);
  });

  card.append(header, body, footer);
  clearEl(root);
  root.appendChild(card);
  root.classList.add('open');

  root.onclick = (e) => {
    if (e.target === root) close();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  const focusable = card.querySelector('button, input, textarea, select, [href]');
  if (focusable) focusable.focus();
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.classList.remove('open');
  clearEl(root);
}

/* ---------- Password Prompt ---------- */

export function promptPassword(projectName) {
  return new Promise((resolve) => {
    const passwordInput = createEl('input', {
      type: 'password',
      class: 'form-input',
      placeholder: 'Enter GitHub password',
      'aria-label': 'GitHub access password',
    });
    
    const toggleBtn = createEl('button', {
      type: 'button',
      class: 'password-toggle',
      text: 'Show',
      onClick: () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.textContent = type === 'password' ? 'Show' : 'Hide';
      },
    });
    
    const wrap = createEl('div', { class: 'password-wrap' }, [passwordInput, toggleBtn]);
    
    const content = createEl('div', {}, [
      createEl('p', { text: `Enter the password to access "${projectName}" on GitHub.` }),
      wrap,
      createEl('p', { id: 'password-prompt-error', class: 'form-error', 'aria-live': 'polite' }),
    ]);
    
    setTimeout(() => passwordInput.focus(), 100);
    
    let submitted = false;
    
    openModal({
      title: 'GitHub Access',
      content,
      actions: [
        { label: 'Cancel', className: 'btn btn-secondary', onClick: () => resolve(null), close: true },
        {
          label: 'Verify',
          className: 'btn btn-primary',
          onClick: () => {
            const password = passwordInput.value;
            if (!password) {
              const error = document.getElementById('password-prompt-error');
              if (error) error.textContent = 'Password is required';
              return;
            }
            submitted = true;
            resolve(password);
          },
          close: false,
        },
      ],
      onClose: () => {
        if (!submitted) resolve(null);
      },
    });
  });
}

/* ---------- Sidebar ---------- */

export function renderSidebar(container, options = {}) {
  const { activeView = 'overview', user = {} } = options;
  clearEl(container);

  const navItem = (view, label, iconSvg) => {
    const isActive = activeView === view;
    return createEl(
      'button',
      {
        class: classNames('sidebar-link', { active: isActive }),
        'aria-current': isActive ? 'page' : undefined,
        onClick: () => state.set('dashboardView', view),
      },
      [
        createEl(
          'svg',
          { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
          [iconSvg]
        ),
        createEl('span', { text: label }),
      ]
    );
  };

  const initials = String(user.name || 'O')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebar = createEl('div', { class: 'sidebar-content' }, [
    createEl('div', { class: 'sidebar-header' }, [
      createEl('a', { href: 'index.html', class: 'brand' }, [
        createEl('span', { class: 'brand-mark' }, ['PH']),
        createEl('span', { text: config.APP_NAME }),
      ]),
    ]),
    createEl('nav', { class: 'sidebar-nav' }, [
      navItem('overview', 'Overview', createEl('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' })),
      navItem('projects', 'Projects', createEl('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' })),
      navItem('categories', 'Categories', createEl('path', { d: 'M4 7h16M4 12h16M4 17h7' })),
      navItem('settings', 'Public settings', createEl('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' })),
      navItem('account', 'Account', createEl('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' })),
    ]),
    createEl('div', { class: 'sidebar-footer' }, [
      createEl('div', { class: 'user-pill', style: 'margin-bottom: 0.75rem;' }, [
        createEl('span', { class: 'avatar' }, [initials]),
        createEl('span', { text: user.name || 'Owner' }),
      ]),
      createEl('a', { href: 'index.html', class: 'btn btn-secondary btn-sm btn-block', style: 'margin-bottom: 0.5rem;' }, ['View public page']),
      createEl('button', { class: 'btn btn-danger btn-sm btn-block', id: 'sidebar-logout' }, ['Log out']),
    ]),
  ]);

  container.appendChild(sidebar);
}

/* ---------- Confirm dialog helper ---------- */

export function confirmDialog(message) {
  return new Promise((resolve) => {
    openModal({
      title: 'Confirm',
      content: createEl('p', { text: message }),
      actions: [
        { label: 'Cancel', className: 'btn btn-secondary', onClick: () => resolve(false), close: true },
        {
          label: 'Confirm',
          className: 'btn btn-danger',
          onClick: () => resolve(true),
          close: true,
        },
      ],
      onClose: () => resolve(false),
    });
  });
}