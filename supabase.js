import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseApi = {
  async getEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  },

  async getVenuesByEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('event_id', eventId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
  },

  async getZonesByVenue(venueId) {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('venue_id', venueId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  },

  async getIncidentsByEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          incident_category:incident_category_id(name, domain)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return [];
    }
  },

  async createIncident(incidentData) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert([incidentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating incident:', error);
      return null;
    }
  },

  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async createUserProfile(userId, email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  },

  async getEventMembers(eventId) {
    try {
      const { data, error } = await supabase
        .from('event_members')
        .select(`
          *,
          user:user_id(email, full_name),
          role:role_id(name)
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching event members:', error);
      return [];
    }
  },

  async getUserEventMembership(userId, eventId) {
    try {
      const { data, error } = await supabase
        .from('event_members')
        .select(`
          *,
          role:role_id(name, permissions)
        `)
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching user event membership:', error);
      return null;
    }
  }
};
