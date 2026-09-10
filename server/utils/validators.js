export function validateProject(data, existingProjects = []) {
  const errors = [];
  
  // Required fields
  if (!data.name || !data.name.trim()) {
    errors.push('Project name is required');
  } else if (data.name.length > 80) {
    errors.push('Project name must be 80 characters or less');
  }
  
  if (!data.slug || !data.slug.trim()) {
    errors.push('Slug is required');
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug may only contain lowercase letters, numbers, and hyphens');
  } else if (data.slug.length > 60) {
    errors.push('Slug must be 60 characters or less');
  } else {
    // Check for duplicate slug
    const duplicate = existingProjects.find(p => p.slug === data.slug.trim().toLowerCase());
    if (duplicate) {
      errors.push('A project with this slug already exists');
    }
  }
  
  if (!data.shortDescription || !data.shortDescription.trim()) {
    errors.push('Short description is required');
  } else if (data.shortDescription.length > 160) {
    errors.push('Short description must be 160 characters or less');
  }
  
  if (data.description && data.description.length > 5000) {
    errors.push('Description is too long');
  }
  
  // URL validation (optional)
  if (data.websiteUrl && data.websiteUrl.trim()) {
    try {
      new URL(data.websiteUrl);
    } catch {
      errors.push('Website URL must be a valid URL');
    }
  }
  
  if (data.githubUrl && data.githubUrl.trim()) {
    try {
      new URL(data.githubUrl);
    } catch {
      errors.push('GitHub URL must be a valid URL');
    }
  }
  
  if (data.imageUrl && data.imageUrl.trim()) {
    try {
      new URL(data.imageUrl);
    } catch {
      errors.push('Image URL must be a valid URL');
    }
  }
  
  if (!data.category || !data.category.trim()) {
    errors.push('Category is required');
  }
  
  // Display order validation
  if (data.displayOrder !== undefined && data.displayOrder !== '') {
    const num = Number(data.displayOrder);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
      errors.push('Display order must be a non-negative integer');
    }
  }
  
  // Password validation (if provided)
  if (data.githubPassword && data.githubPassword.trim()) {
    if (data.githubPassword.length < 6) {
      errors.push('GitHub password must be at least 6 characters');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLogin(email, password) {
  const errors = [];
  
  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (!password || !password.trim()) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeString(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/[<>]/g, '') // Simple XSS prevention
    .slice(0, 10000);
}