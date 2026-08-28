import { supabase, supabaseApi } from './supabase.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.subscribers = [];
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.currentUser = data.user;

      // Check if user profile exists
      const profile = await supabaseApi.getUserProfile(data.user.id);
      if (!profile) {
        // Create user profile if it doesn't exist
        await supabaseApi.createUserProfile(data.user.id, email);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.notifySubscribers(null);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  onAuthChange(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(user) {
    this.subscribers.forEach(callback => callback(user));
  }
}

export const authService = new AuthService();
