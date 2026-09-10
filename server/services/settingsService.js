import storage from '../storage/storageManager.js';
import config from '../config.js';

class SettingsService {
  constructor() {
    this.settingsFile = config.storage.settings;
  }

  async getSettings() {
    const defaults = {
      siteTitle: 'Project Hub',
      tagline: 'Contact To Buy Or To Build Custom Websites.',
      ownerName: 'Owner',
    };
    
    const settings = storage.read(this.settingsFile, {});
    return { ...defaults, ...settings };
  }

  async saveSettings(data) {
    const current = await this.getSettings();
    
    const settings = {
      ...current,
      siteTitle: data.siteTitle ? data.siteTitle.trim() : current.siteTitle,
      tagline: data.tagline !== undefined ? data.tagline.trim() : current.tagline,
      ownerName: data.ownerName ? data.ownerName.trim() : current.ownerName,
    };
    
    storage.write(this.settingsFile, settings);
    return settings;
  }
}

// Singleton
const settingsService = new SettingsService();
export default settingsService;