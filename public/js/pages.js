/**
 * Page controllers.
 * publicPage  — Portfolio view.
 * loginPage   — Owner login.
 * dashboardPage — Admin dashboard.
 */

import state from './state.js';
import config from './config.js';
import {
  projectService,
  categoryService,
  settingsService,
  authService,
} from './services.js';
import {
  qs,
  qsa,
  createEl,
  clearEl,
  debounce,
  formatDate,
  slugify,
  validateProject,
  validateLogin,
} from './utils.js';
import {
  renderPublicHeader,
  renderLoading,
  renderEmpty,
  renderError,
  renderToast,
  openModal,
  closeModal,
  renderSidebar,
  confirmDialog,
  promptPassword,
} from './ui.js';
import { renderProjectCard, renderProjectForm, showFormErrors } from './projectComponents.js';
import { initContactForm } from './contact.js';

/* ---------- Public page ---------- */

export async function initPublicPage() {
  console.log('🌐 Public page initializing...');
  
  const header = qs('#site-header');
  const grid = qs('#projects-grid');
  const searchInput = qs('#project-search');
  const categoryFilters = qs('#category-filters');
  const heroTitle = qs('#hero-title');
  const heroTagline = qs('#hero-tagline');
  const footerYear = qs('#footer-year');

  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  renderLoading(grid, 'Loading projects…');

  try {
    // Use combined endpoint for faster loading
    const response = await fetch('/api/public-data');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load data');
    }
    
    const { settings, projects, categories } = result.data;

    console.log('📊 Public data loaded:', { settings, projects: projects.length, categories: categories.length });

    state.patch({ settings, projects, categories });

    if (heroTitle) heroTitle.textContent = settings.siteTitle || config.APP_NAME;
    if (heroTagline) heroTagline.textContent = settings.tagline || '';
    renderPublicHeader(header, settings);

    renderCategoryFilters(categoryFilters, categories, state.get('filters').category);
    renderProjectGrid(grid, getVisibleProjects(projects, state.get('filters')));

    searchInput?.addEventListener(
      'input',
      debounce((e) => {
        state.set('filters', { ...state.get('filters'), query: e.target.value.trim() });
      }, config.UI.DEBOUNCE_MS)
    );

    // Initialize contact form
    initContactForm();

  } catch (err) {
    console.error('❌ Public page error:', err);
    renderError(grid, 'Unable to load projects. Please try again.', initPublicPage);
  }

  state.subscribe((s) => {
    if (heroTitle) heroTitle.textContent = s.settings?.siteTitle || config.APP_NAME;
    if (heroTagline) heroTagline.textContent = s.settings?.tagline || '';
    renderPublicHeader(header, s.settings);
    renderCategoryFilters(categoryFilters, s.categories, s.filters.category);
    renderProjectGrid(grid, getVisibleProjects(s.projects, s.filters));
  });
}

function renderCategoryFilters(container, categories, activeCategory) {
  if (!container) return;
  clearEl(container);

  const allBtn = createEl(
    'button',
    {
      class: classNames('category-btn', { active: activeCategory === 'All' }),
      onClick: () => state.set('filters', { ...state.get('filters'), category: 'All' }),
    },
    ['All']
  );
  container.appendChild(allBtn);

  categories.forEach((cat) => {
    container.appendChild(
      createEl(
        'button',
        {
          class: classNames('category-btn', { active: activeCategory === cat }),
          onClick: () => state.set('filters', { ...state.get('filters'), category: cat }),
        },
        [cat]
      )
    );
  });
}

function getVisibleProjects(projects, filters) {
  const q = filters.query.toLowerCase();
  return projects
    .filter((p) => p.published || false)
    .filter((p) => (filters.category === 'All' ? true : p.category === filters.category))
    .filter((p) => {
      if (!q) return true;
      const haystack = [p.name, p.shortDescription, p.description, p.category, p.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

function renderProjectGrid(container, projects) {
  if (!container) return;
  clearEl(container);

  // Set minimum height to prevent layout shift
  container.style.minHeight = '400px';

  if (!projects.length) {
    renderEmpty(container, 'No published projects match your filters.');
    return;
  }

  projects.forEach((project) => {
    container.appendChild(renderProjectCard(project));
  });
}

/* ---------- Login page ---------- */

export function initLoginPage() {
  console.log('🔐 Login page initializing...');
  
  // Check if already authenticated
  const isAuth = authService.isAuthenticated();
  console.log('🔐 Initial auth check:', isAuth);
  
  if (isAuth) {
    console.log('✅ Already authenticated, redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return;
  }

  const form = qs('#login-form');
  const emailInput = qs('#email');
  const passwordInput = qs('#password');
  const toggleBtn = qs('#toggle-password');
  const submitBtn = qs('#login-submit');
  const loginError = qs('#login-error');

  if (!form) {
    console.error('❌ Login form not found!');
    return;
  }

  console.log('✅ Login form found, setting up event listeners');

  toggleBtn?.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    console.log('🔐 Login attempt:', { email });

    if (!email) {
      showLoginErrors({ email: 'Email is required' });
      return;
    }
    if (!password || password.length < 6) {
      showLoginErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(submitBtn, true);
    loginError.textContent = '';

    try {
      console.log('📡 Calling authService.login...');
      const result = await authService.login({ username: email, password });
      console.log('✅ Login successful:', result);
      
      renderToast('Signed in successfully.', 'success');
      
      // Small delay to ensure storage is written
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
      }, 300);
    } catch (err) {
      console.error('❌ Login failed:', err);
      loginError.textContent = err.message || 'Login failed. Please try again.';
      passwordInput.value = '';
      passwordInput.focus();
    } finally {
      setLoading(submitBtn, false);
    }
  });

  qs('#forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderToast('Password reset requires a backend. Connect an API to enable this feature.', 'info');
  });
}

function showLoginErrors(errors) {
  clearLoginErrors();
  Object.entries(errors).forEach(([key, message]) => {
    const input = qs(`#${key}`);
    const error = qs(`#${key}-error`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  });
}

function clearLoginErrors() {
  ['email', 'password'].forEach((key) => {
    qs(`#${key}`)?.removeAttribute('aria-invalid');
    qs(`#${key}-error`) && (qs(`#${key}-error`).textContent = '');
  });
}

/* ---------- Dashboard page ---------- */

export async function initDashboardPage() {
  console.log('📊 Dashboard page initializing...');
  
  const isAuth = authService.isAuthenticated();
  console.log('🔐 Auth check:', isAuth);
  
  if (!isAuth) {
    console.log('❌ Not authenticated, redirecting to login...');
    renderToast('Please sign in to access the dashboard.', 'info');
    window.location.href = 'login.html';
    return;
  }

  console.log('✅ Authenticated, loading dashboard...');

  const user = authService.getCurrentUser() || { name: config.DEFAULT_SETTINGS.ownerName };
  console.log('👤 Current user:', user);
  state.set('user', user);

  const sidebar = qs('#sidebar');
  const content = qs('#dashboard-content');
  const pageTitle = qs('#page-title');
  const pageSubtitle = qs('#page-subtitle');

  if (!content) {
    console.error('❌ Dashboard content element not found!');
    return;
  }

  // Mobile sidebar toggle
  const toggleBtn = qs('#sidebar-toggle');
  const overlay = createEl('div', { class: 'sidebar-overlay' });
  document.body.appendChild(overlay);

  const openSidebar = () => {
    if (sidebar) {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    }
  };

  const closeSidebar = () => {
    if (sidebar) {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }
  };

  toggleBtn?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Load data
  try {
    console.log('📦 Loading dashboard data...');
    const [projects, categories, settings] = await Promise.all([
      projectService.getProjects(),
      categoryService.getCategories(),
      settingsService.getSettings(),
    ]);
    console.log('📦 Data loaded:', { projects: projects.length, categories: categories.length });
    state.patch({ projects, categories, settings });
  } catch (err) {
    console.error('❌ Failed to load dashboard data:', err);
    renderToast('Failed to load dashboard data.', 'error');
  }

  state.subscribe((s) => {
    renderSidebar(sidebar, { activeView: s.dashboardView, user: s.user });
    if (pageTitle) pageTitle.textContent = viewTitle(s.dashboardView);
    if (pageSubtitle) pageSubtitle.textContent = viewSubtitle(s.dashboardView, s.user?.name);
    renderDashboardContent(content, s);
    closeSidebar();

    qs('#sidebar-logout')?.addEventListener('click', handleLogout);
  });

  state.notify?.();

  qs('#add-project-btn')?.addEventListener('click', () => openProjectModal());
  
  console.log('✅ Dashboard initialized successfully');
}

function viewTitle(view) {
  const titles = {
    overview: 'Overview',
    projects: 'Projects',
    categories: 'Categories',
    settings: 'Public settings',
    account: 'Account',
  };
  return titles[view] || 'Overview';
}

function viewSubtitle(view, name) {
  if (view === 'overview') return `Welcome back, ${name || 'owner'}.`;
  const subtitles = {
    projects: 'Manage your project portfolio.',
    categories: 'Organize projects by category.',
    settings: 'Control how the public page looks.',
    account: 'Update your account preferences.',
  };
  return subtitles[view] || '';
}

function renderDashboardContent(container, s) {
  clearEl(container);
  switch (s.dashboardView) {
    case 'overview':
      renderOverview(container, s);
      break;
    case 'projects':
      renderProjectsManager(container, s);
      break;
    case 'categories':
      renderCategoriesManager(container, s);
      break;
    case 'settings':
      renderSettingsManager(container, s);
      break;
    case 'account':
      renderAccountManager(container, s);
      break;
    default:
      renderOverview(container, s);
  }
}

/* Dashboard — Overview */

function renderOverview(container, s) {
  const projects = s.projects || [];
  const published = projects.filter((p) => p.published);
  const featured = projects.filter((p) => p.featured);

  const stats = [
    { label: 'Total projects', value: projects.length },
    { label: 'Published', value: published.length },
    { label: 'Featured', value: featured.length },
    { label: 'Categories', value: (s.categories || []).length },
  ];

  container.appendChild(
    createEl('div', { class: 'stats-grid' },
      stats.map((stat) =>
        createEl('div', { class: 'card stat-card' }, [
          createEl('div', { class: 'stat-value', text: String(stat.value) }),
          createEl('div', { class: 'stat-label', text: stat.label }),
        ])
      )
    )
  );

  const recentWrap = createEl('div', { class: 'card', style: 'padding: 1.5rem;' });
  recentWrap.appendChild(createEl('h2', { class: 'section-title', text: 'Recently updated' }));

  const recent = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (!recent.length) {
    recentWrap.appendChild(createEl('p', { class: 'text-secondary', text: 'No projects yet.' }));
  } else {
    const list = createEl('ul', { class: 'category-list' });
    recent.forEach((p) => {
      list.appendChild(
        createEl('li', { class: 'category-item' }, [
          createEl('div', {}, [
            createEl('div', { class: 'category-name', text: p.name }),
            createEl('div', { class: 'category-count', text: `${p.category} · Updated ${formatDate(p.updatedAt)}` }),
          ]),
          createEl('span', { class: classNames('badge', p.published ? 'badge-published' : 'badge-draft') }, [
            p.published ? 'Published' : 'Draft',
          ]),
        ])
      );
    });
    recentWrap.appendChild(list);
  }

  container.appendChild(recentWrap);
}

/* Dashboard — Projects manager */

function renderProjectsManager(container, s) {
  const wrap = createEl('div', {});
  const toolbar = createEl('div', { class: 'section-toolbar' }, [
    createEl('div', { class: 'search-box section-search' }, [
      createEl(
        'svg',
        { class: 'search-icon', width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        [createEl('circle', { cx: '11', cy: '11', r: '8' }), createEl('path', { d: 'm21 21-4.35-4.35' })]
      ),
      createEl('input', {
        class: 'search-input',
        type: 'search',
        placeholder: 'Search projects…',
        onInput: debounce((e) => {
          state.set('filters', { ...state.get('filters'), query: e.target.value.trim() });
        }, config.UI.DEBOUNCE_MS),
      }),
    ]),
    createEl('button', { class: 'btn btn-primary', onClick: () => openProjectModal() }, ['+ New project']),
  ]);
  wrap.appendChild(toolbar);

  const tableWrap = createEl('div', { class: 'data-table-wrap' });
  const table = createEl('table', { class: 'data-table' });
  table.innerHTML = `
    <thead>
      <tr>
        <th>Project</th>
        <th>Category</th>
        <th>Status</th>
        <th>Order</th>
        <th>Updated</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  const q = (state.get('filters').query || '').toLowerCase();
  const filtered = [...s.projects]
    .filter((p) => {
      if (!q) return true;
      return [p.name, p.category, p.tags.join(' ')].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  filtered.forEach((p) => {
    const row = createEl('tr', {});
    row.innerHTML = `
      <td>
        <div class="project-row-title">${escapeHtml(p.name)}</div>
        <div class="project-row-meta">/${p.slug}</div>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td>
        <span class="badge ${p.published ? 'badge-published' : 'badge-draft'}">${p.published ? 'Published' : 'Draft'}</span>
        ${p.featured ? '<span class="badge badge-featured">★</span>' : ''}
        ${p.githubPassword ? '<span class="badge badge-featured" style="background:rgba(255,107,53,0.1);border-color:rgba(255,107,53,0.2);">🔒</span>' : ''}
      </td>
      <td>
        <div class="order-controls">
          <button class="order-btn" aria-label="Move up">▲</button>
          <span>${p.displayOrder ?? 0}</span>
          <button class="order-btn" aria-label="Move down">▼</button>
        </div>
      </td>
      <td>${formatDate(p.updatedAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn">Delete</button>
        </div>
      </td>
    `;

    row.querySelector('.edit-btn').addEventListener('click', () => openProjectModal(p));
    row.querySelector('.delete-btn').addEventListener('click', () => handleDeleteProject(p));
    row.querySelector('[aria-label="Move up"]').addEventListener('click', () => moveProject(p.id, -1, filtered));
    row.querySelector('[aria-label="Move down"]').addEventListener('click', () => moveProject(p.id, 1, filtered));

    tbody.appendChild(row);
  });

  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  if (!filtered.length) {
    const empty = createEl('div', {});
    renderEmpty(empty, 'No projects found. Add your first project above.');
    wrap.appendChild(empty);
  }

  container.appendChild(wrap);
}

async function moveProject(id, direction, sortedProjects) {
  const idx = sortedProjects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= sortedProjects.length) return;

  const reordered = [...sortedProjects];
  [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

  try {
    await projectService.reorderProjects(reordered.map((p) => p.id));
    const projects = await projectService.getProjects();
    state.set('projects', projects);
    renderToast('Project order updated.', 'success');
  } catch (err) {
    renderToast(err.message || 'Failed to reorder projects.', 'error');
  }
}

async function handleDeleteProject(project) {
  const ok = await confirmDialog(`Delete "${project.name}"? This cannot be undone.`);
  if (!ok) return;

  try {
    await projectService.deleteProject(project.id);
    const projects = await projectService.getProjects();
    state.set('projects', projects);
    renderToast('Project deleted.', 'success');
  } catch (err) {
    renderToast(err.message || 'Failed to delete project.', 'error');
  }
}

function openProjectModal(project = null) {
  const categories = state.get('categories') || [];
  const allProjects = state.get('projects') || [];

  const form = renderProjectForm(
    project,
    categories,
    async (data) => {
      const { valid, errors } = validateProject(data, allProjects, project?.id);
      if (!valid) {
        showFormErrors(form, errors);
        return;
      }

      try {
        if (project) {
          await projectService.updateProject(project.id, data);
          renderToast('Project updated.', 'success');
        } else {
          await projectService.createProject(data);
          renderToast('Project created.', 'success');
        }
        const projects = await projectService.getProjects();
        state.set('projects', projects);
        closeModal();
      } catch (err) {
        renderToast(err.message || 'Save failed.', 'error');
      }
    },
    () => closeModal()
  );

  openModal({
    title: project ? 'Edit project' : 'New project',
    content: form,
    actions: [],
    size: 'modal-lg',
  });
}

/* Dashboard — Categories manager */

function renderCategoriesManager(container, s) {
  const wrap = createEl('div', {});

  const addRow = createEl('div', { class: 'section-toolbar' }, [
    createEl('input', {
      id: 'new-category',
      class: 'form-input',
      style: 'max-width: 320px;',
      type: 'text',
      placeholder: 'New category name',
    }),
    createEl('button', { class: 'btn btn-primary', onClick: handleAddCategory }, ['Add category']),
  ]);
  wrap.appendChild(addRow);

  const list = createEl('div', { class: 'category-list' });
  const projectCounts = (s.projects || []).reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  (s.categories || []).forEach((cat) => {
    const count = projectCounts[cat] || 0;
    const item = createEl('div', { class: 'category-item' }, [
      createEl('div', {}, [
        createEl('div', { class: 'category-name', text: cat }),
        createEl('div', { class: 'category-count', text: `${count} project${count === 1 ? '' : 's'}` }),
      ]),
      createEl('div', { class: 'row-actions' }, [
        createEl('button', { class: 'btn btn-secondary btn-sm', onClick: () => handleRenameCategory(cat) }, ['Rename']),
        createEl('button', { class: 'btn btn-danger btn-sm', onClick: () => handleDeleteCategory(cat) }, ['Delete']),
      ]),
    ]);
    list.appendChild(item);
  });

  if (!(s.categories || []).length) {
    const empty = createEl('div', {});
    renderEmpty(empty, 'No categories yet.');
    wrap.appendChild(empty);
  } else {
    wrap.appendChild(list);
  }

  container.appendChild(wrap);
}

async function handleAddCategory() {
  const input = qs('#new-category');
  try {
    await categoryService.addCategory(input.value);
    input.value = '';
    const categories = await categoryService.getCategories();
    const projects = await projectService.getProjects();
    state.patch({ categories, projects });
    renderToast('Category added.', 'success');
  } catch (err) {
    renderToast(err.message || 'Failed to add category.', 'error');
  }
}

async function handleRenameCategory(oldName) {
  const newName = window.prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName.trim() === oldName) return;

  try {
    await categoryService.renameCategory(oldName, newName.trim());
    const [categories, projects] = await Promise.all([categoryService.getCategories(), projectService.getProjects()]);
    state.patch({ categories, projects });
    renderToast('Category renamed.', 'success');
  } catch (err) {
    renderToast(err.message || 'Failed to rename category.', 'error');
  }
}

async function handleDeleteCategory(name) {
  const ok = await confirmDialog(`Delete category "${name}"?`);
  if (!ok) return;

  try {
    await categoryService.deleteCategory(name);
    const categories = await categoryService.getCategories();
    state.set('categories', categories);
    renderToast('Category deleted.', 'success');
  } catch (err) {
    renderToast(err.message || 'Failed to delete category.', 'error');
  }
}

/* Dashboard — Public settings */

function renderSettingsManager(container, s) {
  const settings = s.settings || {};
  const form = createEl('form', { class: 'settings-card card' });

  const makeField = (id, label, value, type = 'text') =>
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: id, text: label }),
      createEl('input', { id, name: id, class: 'form-input', type, value: value || '' }),
    ]);

  form.appendChild(makeField('siteTitle', 'Site title', settings.siteTitle));
  form.appendChild(makeField('tagline', 'Tagline', settings.tagline));
  form.appendChild(makeField('ownerName', 'Owner name', settings.ownerName));

  form.appendChild(
    createEl('button', { type: 'submit', class: 'btn btn-primary' }, ['Save settings'])
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      siteTitle: qs('#siteTitle').value,
      tagline: qs('#tagline').value,
      ownerName: qs('#ownerName').value,
    };
    try {
      await settingsService.saveSettings(data);
      const updated = await settingsService.getSettings();
      state.set('settings', updated);
      renderToast('Settings saved.', 'success');
    } catch (err) {
      renderToast(err.message || 'Failed to save settings.', 'error');
    }
  });

  container.appendChild(form);

  const danger = createEl('div', { class: 'settings-card card', style: 'border-color: rgba(239,68,68,0.25);' });
  danger.appendChild(createEl('h2', { class: 'section-title', text: 'Danger zone' }));
  danger.appendChild(createEl('p', { class: 'form-hint', style: 'margin-bottom: 1rem;', text: 'Reset all local development data including projects, categories, and settings.' }));
  danger.appendChild(
    createEl('button', { type: 'button', class: 'btn btn-danger', onClick: handleResetData }, ['Reset demo data'])
  );
  container.appendChild(danger);
}

/* Dashboard — Account */

function renderAccountManager(container, s) {
  const user = s.user || {};
  const card = createEl('div', { class: 'settings-card card' });
  card.appendChild(createEl('h2', { class: 'section-title', text: 'Account' }));
  
  // Email change section
  card.appendChild(createEl('h3', { class: 'section-title', style: 'font-size:1rem;', text: 'Change Email' }));
  
  const emailForm = createEl('form', { class: 'email-change-form' });
  
  const currentEmailDisplay = createEl('div', { class: 'form-group' }, [
    createEl('label', { class: 'form-label', text: 'Current Email' }),
    createEl('input', { 
      class: 'form-input', 
      type: 'email', 
      value: user.email || user.name || 'Not set',
      disabled: true,
    }),
  ]);
  
  const newEmailInput = createEl('input', {
    id: 'new-email',
    type: 'email',
    class: 'form-input',
    placeholder: 'New email address',
    required: true,
  });
  
  const passwordInput = createEl('input', {
    id: 'email-change-password',
    type: 'password',
    class: 'form-input',
    placeholder: 'Enter your password to confirm',
    required: true,
  });
  
  const emailError = createEl('p', { id: 'email-change-error', class: 'form-error', 'aria-live': 'polite' });
  const emailSuccess = createEl('p', { id: 'email-change-success', class: 'form-hint', style: 'color: var(--success);' });
  
  emailForm.appendChild(currentEmailDisplay);
  
  emailForm.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: 'new-email', text: 'New Email' }),
      newEmailInput,
    ])
  );
  
  emailForm.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: 'email-change-password', text: 'Password' }),
      passwordInput,
    ])
  );
  
  emailForm.appendChild(emailError);
  emailForm.appendChild(emailSuccess);
  
  emailForm.appendChild(
    createEl('button', { type: 'submit', class: 'btn btn-primary' }, ['Update Email'])
  );
  
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.textContent = '';
    emailSuccess.textContent = '';
    
    const newEmail = newEmailInput.value.trim();
    const password = passwordInput.value;
    
    if (!newEmail) {
      emailError.textContent = 'Email is required';
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      emailError.textContent = 'Please enter a valid email address';
      return;
    }
    
    if (!password) {
      emailError.textContent = 'Password is required to confirm identity';
      return;
    }
    
    try {
      const result = await authService.updateEmail(newEmail, password);
      
      const updatedUser = { ...state.get('user'), email: result.data.email };
      state.set('user', updatedUser);
      
      emailSuccess.textContent = '✅ Email updated successfully! You will need to use this email to log in going forward.';
      newEmailInput.value = '';
      passwordInput.value = '';
      
      const emailDisplay = emailForm.querySelector('input[disabled]');
      if (emailDisplay) {
        emailDisplay.value = newEmail;
      }
      
      renderToast('Email updated successfully', 'success');
    } catch (error) {
      emailError.textContent = error.message || 'Failed to update email';
    }
  });
  
  card.appendChild(emailForm);
  
  // Password change section
  card.appendChild(createEl('hr', { style: 'margin: 1.5rem 0; border-color: var(--border);' }));
  card.appendChild(createEl('h3', { class: 'section-title', style: 'font-size:1rem;', text: 'Change Password' }));
  
  const passwordForm = createEl('form', { class: 'password-change-form' });
  
  const currentPwInput = createEl('input', {
    id: 'current-password',
    type: 'password',
    class: 'form-input',
    placeholder: 'Current password',
    required: true,
  });
  
  const newPwInput = createEl('input', {
    id: 'new-password',
    type: 'password',
    class: 'form-input',
    placeholder: 'New password (min 6 characters)',
    required: true,
    minlength: 6,
  });
  
  const confirmPwInput = createEl('input', {
    id: 'confirm-password',
    type: 'password',
    class: 'form-input',
    placeholder: 'Confirm new password',
    required: true,
  });
  
  const passwordError = createEl('p', { id: 'password-change-error', class: 'form-error', 'aria-live': 'polite' });
  const passwordSuccess = createEl('p', { id: 'password-change-success', class: 'form-hint', style: 'color: var(--success);' });
  
  passwordForm.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: 'current-password', text: 'Current Password' }),
      currentPwInput,
    ])
  );
  
  passwordForm.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: 'new-password', text: 'New Password' }),
      newPwInput,
    ])
  );
  
  passwordForm.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: 'confirm-password', text: 'Confirm New Password' }),
      confirmPwInput,
    ])
  );
  
  passwordForm.appendChild(passwordError);
  passwordForm.appendChild(passwordSuccess);
  
  passwordForm.appendChild(
    createEl('button', { type: 'submit', class: 'btn btn-primary' }, ['Update Password'])
  );
  
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordError.textContent = '';
    passwordSuccess.textContent = '';
    
    const currentPassword = currentPwInput.value;
    const newPassword = newPwInput.value;
    const confirmPassword = confirmPwInput.value;
    
    if (newPassword !== confirmPassword) {
      passwordError.textContent = 'New passwords do not match';
      return;
    }
    
    if (newPassword.length < 6) {
      passwordError.textContent = 'New password must be at least 6 characters';
      return;
    }
    
    try {
      await authService.changePassword(currentPassword, newPassword);
      passwordSuccess.textContent = '✅ Password updated successfully!';
      currentPwInput.value = '';
      newPwInput.value = '';
      confirmPwInput.value = '';
    } catch (error) {
      passwordError.textContent = error.message || 'Failed to update password';
    }
  });
  
  card.appendChild(passwordForm);
  
  // Logout button
  card.appendChild(
    createEl('div', { style: 'margin-top: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.5rem;' }, [
      createEl('button', { type: 'button', class: 'btn btn-secondary', onClick: handleLogout }, ['Log out']),
    ])
  );
  
  container.appendChild(card);
}

async function handleLogout() {
  await authService.logout();
  renderToast('Logged out.', 'info');
  window.location.href = 'index.html';
}

async function handleResetData() {
  const ok = await confirmDialog('Reset all local demo data? This cannot be undone.');
  if (!ok) return;

  try {
    Object.values(config.STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    const [projects, categories, settings] = await Promise.all([
      projectService.getProjects(),
      categoryService.getCategories(),
      settingsService.getSettings(),
    ]);
    state.patch({ projects, categories, settings });
    renderToast('Demo data reset.', 'success');
  } catch (err) {
    renderToast(err.message || 'Reset failed.', 'error');
  }
}

/* ---------- Helpers ---------- */

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function classNames(...parts) {
  return parts
    .flatMap((p) => {
      if (typeof p === 'string') return p;
      if (Array.isArray(p)) return p;
      if (typeof p === 'object') return Object.entries(p).filter(([, v]) => v).map(([k]) => k);
      return [];
    })
    .filter(Boolean)
    .join(' ');
}