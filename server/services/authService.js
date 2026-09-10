import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import storage from '../storage/storageManager.js';
import config from '../config.js';
import { generateId } from '../utils/idGenerator.js';

class AuthService {
  constructor() {
    this.usersFile = config.storage.users;
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async getUsers() {
    return storage.read(this.usersFile, []);
  }

  async saveUsers(users) {
    storage.write(this.usersFile, users);
  }

  async findUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(email, password) {
    const users = await this.getUsers();
    
    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists');
    }
    
    const hashedPassword = await this.hashPassword(password);
    const user = {
      id: generateId('usr'),
      email: email.toLowerCase(),
      password: hashedPassword,
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    users.push(user);
    await this.saveUsers(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async authenticateUser(email, password) {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isValid = await this.verifyPassword(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async initializeOwner() {
    const users = await this.getUsers();
    const ownerEmail = config.owner.email;
    
    // Check if owner already exists
    if (users.some(u => u.email.toLowerCase() === ownerEmail.toLowerCase())) {
      console.log(`✅ Owner already exists: ${ownerEmail}`);
      return;
    }
    
    // Create owner
    await this.createUser(ownerEmail, config.owner.password);
    console.log(`✅ Owner account initialized: ${ownerEmail}`);
  }

  async updatePassword(email, newPassword) {
    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const hashedPassword = await this.hashPassword(newPassword);
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    
    await this.saveUsers(users);
    return { success: true };
  }

  async updateEmail(currentEmail, newEmail) {
    const users = await this.getUsers();
    
    // Check if new email already exists
    if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
      throw new Error('Email already in use');
    }
    
    const userIndex = users.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex].email = newEmail.toLowerCase();
    users[userIndex].updatedAt = new Date().toISOString();
    
    await this.saveUsers(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }
}

// Singleton
const authService = new AuthService();
export default authService;