// Authentication Service
import { supabase } from './supabase.js';

export class AuthService {
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

      // Create user profile if needed
      await this.createUserProfile(data.user);

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
      this.notifySubscribers(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        this.currentUser = user;
        await this.createUserProfile(user);
      }

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async createUserProfile(user) {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist, create it
      if (!existingProfile) {
        await supabase.from('users').insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            status: 'active'
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Profile might already exist, which is fine
    }
  }

  onAuthChange(callback) {
    // Get initial state
    this.getCurrentUser().then(user => {
      callback(user);
    });

    // Subscribe to auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      this.currentUser = user;
      callback(user);
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(user) {
    this.subscribers.forEach(callback => {
      callback(user);
    });
  }
}
