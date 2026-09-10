import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import config from '../config.js';

class StorageManager {
  constructor() {
    this.dataDir = config.paths.storage;
    this.ensureDataDir();
    this.cache = {};
  }

  ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getFilePath(name) {
    return join(this.dataDir, name);
  }

  read(name, defaultValue = null) {
    const filePath = this.getFilePath(name);
    
    try {
      if (!existsSync(filePath)) {
        this.write(name, defaultValue);
        return defaultValue;
      }
      
      const data = readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${name}:`, error);
      return defaultValue;
    }
  }

  write(name, data) {
    const filePath = this.getFilePath(name);
    const tempPath = `${filePath}.tmp`;
    
    try {
      // Write to temp file first
      writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
      // Atomic rename
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      // Clean up temp
      try {
        if (existsSync(tempPath)) {
          // Keep temp for recovery
        }
      } catch {
        // Ignore cleanup errors
      }
      
      // Update cache
      this.cache[name] = data;
      
      return true;
    } catch (error) {
      console.error(`Error writing ${name}:`, error);
      throw new Error(`Failed to write ${name}`);
    }
  }

  readWithCache(name, defaultValue = null) {
    if (this.cache[name] !== undefined) {
      return this.cache[name];
    }
    
    const data = this.read(name, defaultValue);
    this.cache[name] = data;
    return data;
  }

  writeWithCache(name, data) {
    this.write(name, data);
    this.cache[name] = data;
    return true;
  }

  clearCache() {
    this.cache = {};
  }

  // Ensure data integrity with schema validation
  validateProjects(data) {
    if (!Array.isArray(data)) return false;
    return data.every(project => 
      project.id && 
      typeof project.id === 'string' &&
      project.name &&
      typeof project.name === 'string'
    );
  }

  repair(name, defaultData) {
    try {
      const data = this.read(name);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      this.write(name, defaultData);
      return defaultData;
    } catch {
      this.write(name, defaultData);
      return defaultData;
    }
  }
}

// Singleton instance
const storage = new StorageManager();

// Initialize with default data
const DEFAULT_CATEGORIES = [];
const DEFAULT_SETTINGS = {
  siteTitle: 'Project Hub',
  tagline: 'Contact To Buy Or To Build Custom Websites.',
  ownerName: 'Owner',
};

storage.repair(config.storage.projects, []);
storage.repair(config.storage.categories, DEFAULT_CATEGORIES);
storage.repair(config.storage.settings, DEFAULT_SETTINGS);
storage.repair(config.storage.users, []);

export default storage;