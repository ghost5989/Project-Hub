import storage from '../storage/storageManager.js';
import config from '../config.js';
import { generateId } from '../utils/idGenerator.js';
import { validateProject } from '../utils/validators.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

class ProjectService {
  constructor() {
    this.projectsFile = config.storage.projects;
  }

  async getProjects() {
    return storage.read(this.projectsFile, []);
  }

  async saveProjects(projects) {
    storage.write(this.projectsFile, projects);
  }

  async findProjectById(id) {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  async createProject(data) {
    const projects = await this.getProjects();
    
    // Validate input
    const validation = validateProject(data, projects);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const now = new Date().toISOString();
    
    // Hash GitHub password if provided
    let githubPasswordHash = null;
    if (data.githubPassword && data.githubPassword.trim()) {
      githubPasswordHash = await hashPassword(data.githubPassword.trim());
    }
    
    const project = {
      id: generateId('proj'),
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      shortDescription: data.shortDescription.trim(),
      description: data.description ? data.description.trim() : '',
      websiteUrl: data.websiteUrl ? data.websiteUrl.trim() : '',
      githubUrl: data.githubUrl ? data.githubUrl.trim() : '',
      githubPasswordHash: githubPasswordHash,
      imageUrl: data.imageUrl ? data.imageUrl.trim() : '',
      category: data.category.trim(),
      tags: Array.isArray(data.tags) 
        ? data.tags.map(t => t.trim()).filter(Boolean)
        : data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      featured: Boolean(data.featured),
      published: Boolean(data.published),
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      createdAt: now,
      updatedAt: now,
    };
    
    projects.push(project);
    await this.saveProjects(projects);
    
    // Return project without password hash
    const { githubPasswordHash: _, ...publicProject } = project;
    return publicProject;
  }

  async updateProject(id, data) {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Project not found');
    }
    
    const existing = projects[index];
    
    // Validate input (excluding slug uniqueness for self)
    const validation = validateProject(data, projects.filter(p => p.id !== id));
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    
    // Update fields
    const updated = {
      ...existing,
      name: data.name ? data.name.trim() : existing.name,
      slug: data.slug ? data.slug.trim().toLowerCase() : existing.slug,
      shortDescription: data.shortDescription ? data.shortDescription.trim() : existing.shortDescription,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl.trim() : existing.websiteUrl,
      githubUrl: data.githubUrl !== undefined ? data.githubUrl.trim() : existing.githubUrl,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl.trim() : existing.imageUrl,
      category: data.category ? data.category.trim() : existing.category,
      tags: data.tags !== undefined 
        ? (Array.isArray(data.tags) 
            ? data.tags.map(t => t.trim()).filter(Boolean)
            : data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
        : existing.tags,
      featured: data.featured !== undefined ? Boolean(data.featured) : existing.featured,
      published: data.published !== undefined ? Boolean(data.published) : existing.published,
      displayOrder: data.displayOrder !== undefined && typeof data.displayOrder === 'number' 
        ? data.displayOrder 
        : existing.displayOrder,
      updatedAt: new Date().toISOString(),
    };
    
    // Handle password update
    if (data.githubPassword !== undefined) {
      if (data.githubPassword && data.githubPassword.trim()) {
        updated.githubPasswordHash = await hashPassword(data.githubPassword.trim());
      } else {
        updated.githubPasswordHash = null;
      }
    }
    
    projects[index] = updated;
    await this.saveProjects(projects);
    
    // Return without password hash
    const { githubPasswordHash: _, ...publicProject } = updated;
    return publicProject;
  }

  async deleteProject(id) {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) {
      throw new Error('Project not found');
    }
    
    await this.saveProjects(filtered);
    return { success: true };
  }

  async verifyGithubAccess(id, password) {
    const project = await this.findProjectById(id);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // If no password set, allow access
    if (!project.githubPasswordHash) {
      return {
        success: true,
        githubUrl: project.githubUrl,
        isProtected: false,
      };
    }
    
    // Verify password
    const isValid = await verifyPassword(password, project.githubPasswordHash);
    
    if (!isValid) {
      return {
        success: false,
        message: 'Incorrect password',
        isProtected: true,
      };
    }
    
    return {
      success: true,
      githubUrl: project.githubUrl,
      isProtected: true,
    };
  }

  async reorderProjects(orderedIds) {
    const projects = await this.getProjects();
    const projectMap = new Map(projects.map(p => [p.id, p]));
    
    const reordered = [];
    const remaining = [];
    
    // Reorder based on provided IDs
    orderedIds.forEach(id => {
      const project = projectMap.get(id);
      if (project) {
        reordered.push(project);
        projectMap.delete(id);
      }
    });
    
    // Add remaining projects
    projectMap.forEach(project => {
      remaining.push(project);
    });
    
    // Sort remaining by displayOrder
    remaining.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    const allProjects = [...reordered, ...remaining];
    
    // Update displayOrder
    const finalProjects = allProjects.map((p, index) => ({
      ...p,
      displayOrder: index,
      updatedAt: new Date().toISOString(),
    }));
    
    await this.saveProjects(finalProjects);
    
    // Return without password hashes
    return finalProjects.map(({ githubPasswordHash, ...p }) => p);
  }

  async getPublicProjects() {
    const projects = await this.getProjects();
    return projects
      .filter(p => p.published)
      .map(({ githubPasswordHash, ...p }) => ({
        ...p,
        githubProtected: !!githubPasswordHash,
        // Don't return githubUrl if protected
        githubUrl: githubPasswordHash ? null : p.githubUrl,
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getProjectForPublic(id) {
    const project = await this.findProjectById(id);
    
    if (!project || !project.published) {
      return null;
    }
    
    const { githubPasswordHash, ...publicProject } = project;
    return {
      ...publicProject,
      githubProtected: !!githubPasswordHash,
      githubUrl: githubPasswordHash ? null : publicProject.githubUrl,
    };
  }
}

// Singleton
const projectService = new ProjectService();
export default projectService;