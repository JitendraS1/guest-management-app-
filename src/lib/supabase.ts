import { createClient } from '@supabase/supabase-js';
import { Guest, Event } from '@/types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hjnmdjuygxrprwcpwuzv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqbm1kanV5Z3hycHJ3Y3B3dXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzU4NDcsImV4cCI6MjA3MDY1MTg0N30.c1wVBav7_lstSE2aqmBesRWlKwwVyFE0t_KfWa59Qfc';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const eventOperations = {
  async getAll(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        date: event.date,
        location: event.location,
        createdAt: new Date(event.created_at)
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async create(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        date: data.date,
        location: data.location,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async delete(eventId: string): Promise<void> {
    try {
      // First delete all guests for this event
      await supabase
        .from('guests')
        .delete()
        .eq('event_id', eventId);

      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async getById(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) return null;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        date: data.date,
        location: data.location,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  }
};

export const guestOperations = {
  async getAll(): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        inviteCode: guest.invite_code,
        isPresent: guest.is_present,
        checkedInAt: guest.checked_in_at ? new Date(guest.checked_in_at) : undefined,
        eventId: guest.event_id
      }));
    } catch (error) {
      console.error('Error fetching guests:', error);
      return [];
    }
  },

  async getByEventId(eventId: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        inviteCode: guest.invite_code,
        isPresent: guest.is_present,
        checkedInAt: guest.checked_in_at ? new Date(guest.checked_in_at) : undefined,
        eventId: guest.event_id
      }));
    } catch (error) {
      console.error('Error fetching guests by event ID:', error);
      return [];
    }
  },

  async create(guest: Omit<Guest, 'id'>): Promise<Guest> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          invite_code: guest.inviteCode,
          is_present: guest.isPresent,
          checked_in_at: guest.checkedInAt?.toISOString(),
          event_id: guest.eventId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        inviteCode: data.invite_code,
        isPresent: data.is_present,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        eventId: data.event_id
      };
    } catch (error) {
      console.error('Error creating guest:', error);
      throw error;
    }
  },

  async update(guestId: string, updates: Partial<Guest>): Promise<void> {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.inviteCode !== undefined) updateData.invite_code = updates.inviteCode;
      if (updates.isPresent !== undefined) updateData.is_present = updates.isPresent;
      if (updates.checkedInAt !== undefined) updateData.checked_in_at = updates.checkedInAt?.toISOString();
      if (updates.eventId !== undefined) updateData.event_id = updates.eventId;
      
      const { error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('id', guestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  },

  async delete(guestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  },

  async getByInviteCode(inviteCode: string): Promise<Guest | null> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (error) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        inviteCode: data.invite_code,
        isPresent: data.is_present,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        eventId: data.event_id
      };
    } catch (error) {
      console.error('Error fetching guest by invite code:', error);
      return null;
    }
  }
};