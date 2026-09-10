/**
 * Utility functions: DOM helpers, formatters, validators.
 */

export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') {
      el.textContent = value;
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'class' || key === 'className') {
      el.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== undefined && value !== null) {
      el.setAttribute(key, value);
    }
  });

  children.forEach((child) => {
    if (child == null) return;
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });

  return el;
}

export function clearEl(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function classNames(...parts) {
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

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function truncate(str, length = 120) {
  const s = String(str || '');
  return s.length > length ? s.slice(0, length).trim() + '…' : s;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelativeDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/* ---------- Validation ---------- */

export function isRequired(value) {
  return String(value || '').trim().length > 0;
}

export function isSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || ''));
}

export function isUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function maxLength(value, max) {
  return String(value || '').length <= max;
}

export function isNonNegativeInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
}

export function validateProject(project, existingProjects = [], excludeId = null) {
  const errors = {};

  if (!isRequired(project.name)) errors.name = 'Project name is required.';
  else if (!maxLength(project.name, 80)) errors.name = 'Project name must be 80 characters or less.';

  if (!isRequired(project.slug)) errors.slug = 'Slug is required.';
  else if (!isSlug(project.slug)) errors.slug = 'Slug may only contain lowercase letters, numbers, and hyphens.';
  else if (!maxLength(project.slug, 60)) errors.slug = 'Slug must be 60 characters or less.';
  else {
    const duplicate = existingProjects.find(
      (p) => p.slug === project.slug && p.id !== excludeId
    );
    if (duplicate) errors.slug = 'A project with this slug already exists.';
  }

  if (!isRequired(project.shortDescription)) {
    errors.shortDescription = 'Short description is required.';
  } else if (!maxLength(project.shortDescription, 160)) {
    errors.shortDescription = 'Short description must be 160 characters or less.';
  }

  if (!maxLength(project.description, 5000)) errors.description = 'Description is too long.';

  if (project.websiteUrl && !isUrl(project.websiteUrl)) errors.websiteUrl = 'Enter a valid URL.';
  if (project.githubUrl && !isUrl(project.githubUrl)) errors.githubUrl = 'Enter a valid URL.';
  if (project.imageUrl && !isUrl(project.imageUrl)) errors.imageUrl = 'Enter a valid image URL.';

  if (!isRequired(project.category)) errors.category = 'Category is required.';

  if (project.displayOrder !== undefined && project.displayOrder !== '' && !isNonNegativeInt(project.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  if (project.githubPassword && project.githubPassword.length < 6) {
    errors.githubPassword = 'GitHub password must be at least 6 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLogin(credentials) {
  const errors = {};
  if (!isRequired(credentials.username || credentials.email)) {
    errors.username = 'Email is required.';
  } else if (credentials.username && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.username)) {
    errors.username = 'Valid email is required.';
  }
  if (!isRequired(credentials.password)) errors.password = 'Password is required.';
  else if (String(credentials.password).length < 6) errors.password = 'Password must be at least 6 characters.';
  return { valid: Object.keys(errors).length === 0, errors };
}