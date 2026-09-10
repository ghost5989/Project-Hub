/**
 * Project-specific components: card and reusable add/edit form.
 */

import { createEl, classNames, truncate, slugify, validateProject } from './utils.js';
import config from './config.js';
import { promptPassword } from './ui.js';
import { projectService } from './services.js';
import { renderToast } from './ui.js';

/* ---------- Project Card ---------- */

export function renderProjectCard(project, options = {}) {
  const { showAdminControls = false, onEdit, onDelete, onToggleFeatured, onTogglePublished } = options;

  const card = createEl('article', {
    class: 'card project-card',
    'data-project-id': project.id,
    'data-category': project.category,
  });

  const imageWrap = createEl('div', { class: 'project-image-wrap' });
  if (project.imageUrl) {
    // Optimized image loading with dimensions and fetchpriority
    imageWrap.appendChild(
      createEl('img', {
        class: 'project-image',
        src: project.imageUrl,
        alt: `${project.name} preview`,
        loading: 'lazy',
        decoding: 'async',
        width: '320',
        height: '180',
        fetchpriority: project.featured ? 'high' : 'auto',
        onerror: function() {
          // Fallback if image fails to load
          this.style.display = 'none';
          const fallback = this.parentElement.querySelector('.project-image-fallback');
          if (fallback) fallback.style.display = 'flex';
        }
      })
    );
    // Add fallback that's hidden by default
    const fallback = createEl('div', { 
      class: 'project-image-fallback', 
      style: 'display:none;' 
    }, [
      createEl('span', { text: project.name.slice(0, 2).toUpperCase() }),
    ]);
    imageWrap.appendChild(fallback);
  } else {
    imageWrap.appendChild(
      createEl('div', { class: 'project-image-fallback' }, [
        createEl('span', { text: project.name.slice(0, 2).toUpperCase() }),
      ])
    );
  }

  const badges = createEl('div', { class: 'project-badges' });
  if (project.featured) {
    badges.appendChild(createEl('span', { class: 'badge badge-featured' }, ['★ Featured']));
  }
  badges.appendChild(createEl('span', { class: 'badge badge-category' }, [project.category]));
  if (project.githubProtected) {
    badges.appendChild(createEl('span', { class: 'badge badge-featured', style: 'background:rgba(255,107,53,0.1);border-color:rgba(255,107,53,0.2);' }, ['🔒 Protected']));
  }
  imageWrap.appendChild(badges);

  const body = createEl('div', { class: 'project-body' });

  body.appendChild(createEl('h3', { class: 'project-title', text: project.name }));
  body.appendChild(createEl('p', { class: 'project-desc', text: truncate(project.shortDescription, 140) }));

  if (project.tags && project.tags.length) {
    const tagsWrap = createEl('div', { class: 'project-tags' });
    project.tags.slice(0, 5).forEach((tag) => {
      tagsWrap.appendChild(createEl('span', { class: 'badge badge-tag' }, [tag]));
    });
    body.appendChild(tagsWrap);
  }

  const actions = createEl('div', { class: 'project-actions' });

  if (project.websiteUrl) {
    actions.appendChild(
      createEl(
        'a',
        {
          href: project.websiteUrl,
          class: 'btn btn-primary btn-sm',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        ['Visit Website']
      )
    );
  }

  // GitHub button with password protection
  const githubBtn = createEl('button', {
    class: classNames('btn btn-sm', project.websiteUrl ? 'btn-secondary' : 'btn-primary'),
    text: project.githubProtected ? '🔒 GitHub' : 'GitHub',
    onClick: async () => {
      if (project.githubProtected) {
        const password = await promptPassword(project.name);
        if (password === null) return;
        
        try {
          const result = await projectService.verifyGithubAccess(project.id, password);
          if (result.success && result.githubUrl) {
            window.open(result.githubUrl, '_blank', 'noopener,noreferrer');
          } else if (result.success && !result.githubUrl) {
            renderToast('GitHub URL not configured for this project.', 'error');
          }
        } catch (error) {
          renderToast(error.message || 'Access denied.', 'error');
        }
      } else if (project.githubUrl) {
        window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
      } else {
        renderToast('GitHub URL not configured for this project.', 'error');
      }
    },
  });
  actions.appendChild(githubBtn);

  if (showAdminControls) {
    actions.innerHTML = '';
    actions.appendChild(
      createEl('button', {
        class: classNames('btn btn-sm', project.featured ? 'btn-primary' : 'btn-secondary'),
        onClick: () => onToggleFeatured?.(project),
      }, [project.featured ? 'Unfeature' : 'Feature'])
    );
    actions.appendChild(
      createEl('button', {
        class: classNames('btn btn-sm', project.published ? 'btn-secondary' : 'btn-ghost'),
        onClick: () => onTogglePublished?.(project),
      }, [project.published ? 'Unpublish' : 'Publish'])
    );
    actions.appendChild(
      createEl('button', { class: 'btn btn-secondary btn-sm', onClick: () => onEdit?.(project) }, ['Edit'])
    );
    actions.appendChild(
      createEl('button', { class: 'btn btn-danger btn-sm', onClick: () => onDelete?.(project) }, ['Delete'])
    );
  }

  body.appendChild(actions);
  card.appendChild(imageWrap);
  card.appendChild(body);

  return card;
}

/* ---------- Project Form ---------- */

export function renderProjectForm(project = null, categories = [], onSubmit, onCancel) {
  const isEdit = !!project;
  const form = createEl('form', { id: 'project-form', novalidate: true });

  const field = (label, inputEl, errorId) =>
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'form-label', for: inputEl.id || inputEl.name, text: label }),
      inputEl,
      createEl('p', { id: errorId, class: 'form-error', 'aria-live': 'polite' }),
    ]);

  const nameInput = createEl('input', {
    id: 'project-name',
    name: 'name',
    class: 'form-input',
    type: 'text',
    value: project?.name || '',
    placeholder: 'Project name',
    required: true,
    maxlength: 80,
  });

  const slugInput = createEl('input', {
    id: 'project-slug',
    name: 'slug',
    class: 'form-input',
    type: 'text',
    value: project?.slug || '',
    placeholder: 'project-slug',
    required: true,
    maxlength: 60,
  });

  const shortInput = createEl('textarea', {
    id: 'project-shortDescription',
    name: 'shortDescription',
    class: 'form-textarea',
    placeholder: 'A short summary shown on cards (max 160 chars)',
    maxlength: 160,
    text: project?.shortDescription || '',
  });

  const descInput = createEl('textarea', {
    id: 'project-description',
    name: 'description',
    class: 'form-textarea',
    placeholder: 'Full description, markdown friendly',
    text: project?.description || '',
  });

  const websiteInput = createEl('input', {
    id: 'project-websiteUrl',
    name: 'websiteUrl',
    class: 'form-input',
    type: 'url',
    value: project?.websiteUrl || '',
    placeholder: 'https://example.com',
  });

  const githubInput = createEl('input', {
    id: 'project-githubUrl',
    name: 'githubUrl',
    class: 'form-input',
    type: 'url',
    value: project?.githubUrl || '',
    placeholder: 'https://github.com/username/repo',
  });

  const imageInput = createEl('input', {
    id: 'project-imageUrl',
    name: 'imageUrl',
    class: 'form-input',
    type: 'url',
    value: project?.imageUrl || '',
    placeholder: 'https://example.com/image.png',
  });

  const categorySelect = createEl('select', {
    id: 'project-category',
    name: 'category',
    class: 'form-select',
    required: true,
  });
  categorySelect.appendChild(createEl('option', { value: '', text: 'Select a category' }));
  categories.forEach((cat) => {
    categorySelect.appendChild(createEl('option', { value: cat, text: cat, selected: cat === project?.category }));
  });

  const tagsInput = createEl('input', {
    id: 'project-tags',
    name: 'tags',
    class: 'form-input',
    type: 'text',
    value: Array.isArray(project?.tags) ? project.tags.join(', ') : '',
    placeholder: 'React, Node.js, Design',
  });

  const orderInput = createEl('input', {
    id: 'project-displayOrder',
    name: 'displayOrder',
    class: 'form-input',
    type: 'number',
    min: 0,
    step: 1,
    value: project?.displayOrder ?? 0,
  });

  const featuredInput = createEl('input', {
    id: 'project-featured',
    name: 'featured',
    type: 'checkbox',
    checked: !!project?.featured,
  });

  const publishedInput = createEl('input', {
    id: 'project-published',
    name: 'published',
    type: 'checkbox',
    checked: project ? !!project.published : true,
  });

  // Password field with toggle
  const passwordInput = createEl('input', {
    id: 'project-githubPassword',
    name: 'githubPassword',
    class: 'form-input',
    type: 'password',
    value: '',
    placeholder: 'Optional password for GitHub access',
  });

  const passwordToggle = createEl('button', {
    type: 'button',
    class: 'password-toggle',
    'aria-label': 'Toggle password visibility',
    onClick: () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      passwordToggle.textContent = type === 'password' ? 'Show' : 'Hide';
    },
    text: 'Show',
  });

  const passwordWrap = createEl('div', { class: 'password-wrap' }, [passwordInput, passwordToggle]);

  // Auto-generate slug from name on add.
  if (!isEdit) {
    nameInput.addEventListener('input', () => {
      if (!slugInput.dataset.touched) {
        slugInput.value = slugify(nameInput.value);
      }
    });
    slugInput.addEventListener('input', () => {
      slugInput.dataset.touched = 'true';
    });
  }

  form.appendChild(field('Project name *', nameInput, 'project-name-error'));
  form.appendChild(field('Slug *', slugInput, 'project-slug-error'));
  form.appendChild(field('Short description *', shortInput, 'project-shortDescription-error'));
  form.appendChild(field('Description', descInput, 'project-description-error'));

  const urlRow = createEl('div', { class: 'form-row' }, [
    field('Website URL', websiteInput, 'project-websiteUrl-error'),
    field('GitHub URL', githubInput, 'project-githubUrl-error'),
  ]);
  form.appendChild(urlRow);

  form.appendChild(field('Cover image URL', imageInput, 'project-imageUrl-error'));

  const metaRow = createEl('div', { class: 'form-row' }, [
    field('Category *', categorySelect, 'project-category-error'),
    field('Display order', orderInput, 'project-displayOrder-error'),
  ]);
  form.appendChild(metaRow);

  form.appendChild(field('Tags (comma separated)', tagsInput, 'project-tags-error'));
  form.appendChild(
    createEl('p', { class: 'form-hint', text: 'Separate tags with commas. Used for filtering and project cards.' })
  );

  // Password field with hint
  form.appendChild(field('GitHub Password (optional)', passwordWrap, 'project-githubPassword-error'));
  form.appendChild(
    createEl('p', { class: 'form-hint', text: 'Set a password to protect GitHub access. Leave empty for public access.' })
  );

  form.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'checkbox-row' }, [
        featuredInput,
        createEl('span', { text: 'Feature this project on the public page' }),
      ]),
    ])
  );

  form.appendChild(
    createEl('div', { class: 'form-group' }, [
      createEl('label', { class: 'checkbox-row' }, [
        publishedInput,
        createEl('span', { text: 'Published (visible to the public)' }),
      ]),
    ])
  );

  // Show current password status if editing
  if (isEdit && project.githubPassword) {
    form.appendChild(
      createEl('p', { class: 'form-hint', style: 'color: var(--success);', text: '✅ GitHub password is set. Leave blank to keep current password.' })
    );
  }

  const footer = createEl('div', { class: 'modal-footer', style: 'padding: 0; border: none;' }, [
    createEl('button', { type: 'button', class: 'btn btn-secondary', onClick: onCancel }, ['Cancel']),
    createEl('button', { type: 'submit', class: 'btn btn-primary' }, [isEdit ? 'Save changes' : 'Create project']),
  ]);

  form.appendChild(footer);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const data = {
      name: nameInput.value,
      slug: slugInput.value,
      shortDescription: shortInput.value,
      description: descInput.value,
      websiteUrl: websiteInput.value,
      githubUrl: githubInput.value,
      githubPassword: passwordInput.value || undefined,
      imageUrl: imageInput.value,
      category: categorySelect.value,
      tags: tagsInput.value,
      featured: featuredInput.checked,
      published: publishedInput.checked,
      displayOrder: orderInput.value,
    };

    onSubmit?.(data, project?.id);
  });

  return form;
}

export function showFormErrors(form, errors) {
  clearFormErrors(form);
  Object.entries(errors).forEach(([key, message]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
    }
    const errorEl = form.querySelector(`#project-${key}-error`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

export function clearFormErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
}