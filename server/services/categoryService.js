import storage from '../storage/storageManager.js';
import config from '../config.js';
import projectService from './projectService.js';

class CategoryService {
  constructor() {
    this.categoriesFile = config.storage.categories;
  }

  async getCategories() {
    return storage.read(this.categoriesFile, []);
  }

  async saveCategories(categories) {
    storage.write(this.categoriesFile, categories);
  }

  async addCategory(name) {
    const cleaned = name.trim();
    if (!cleaned) {
      throw new Error('Category name is required');
    }
    
    const categories = await this.getCategories();
    
    // Check for duplicates (case insensitive)
    if (categories.some(c => c.toLowerCase() === cleaned.toLowerCase())) {
      throw new Error('Category already exists');
    }
    
    categories.push(cleaned);
    await this.saveCategories(categories);
    return categories;
  }

  async renameCategory(oldName, newName) {
    const cleaned = newName.trim();
    if (!cleaned) {
      throw new Error('Category name is required');
    }
    
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c === oldName);
    
    if (index === -1) {
      throw new Error('Category not found');
    }
    
    // Check for duplicates (case insensitive, excluding self)
    if (categories.some((c, i) => i !== index && c.toLowerCase() === cleaned.toLowerCase())) {
      throw new Error('Category already exists');
    }
    
    categories[index] = cleaned;
    await this.saveCategories(categories);
    
    // Update projects that use this category
    const projects = await projectService.getProjects();
    const updatedProjects = projects.map(p => 
      p.category === oldName ? { ...p, category: cleaned, updatedAt: new Date().toISOString() } : p
    );
    await projectService.saveProjects(updatedProjects);
    
    return categories;
  }

  async deleteCategory(name) {
    const categories = await this.getCategories();
    
    if (!categories.includes(name)) {
      throw new Error('Category not found');
    }
    
    // Check if category is in use
    const projects = await projectService.getProjects();
    const inUse = projects.some(p => p.category === name);
    
    if (inUse) {
      throw new Error('Cannot delete a category that is assigned to projects');
    }
    
    const updated = categories.filter(c => c !== name);
    await this.saveCategories(updated);
    return updated;
  }
}

// Singleton
const categoryService = new CategoryService();
export default categoryService;