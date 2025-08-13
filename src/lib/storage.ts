import { Guest, Event } from '@/types';
import { eventOperations, guestOperations } from './supabase';

export const storage = {
  // Guest operations
  async getGuests(): Promise<Guest[]> {
    try {
      return await guestOperations.getAll();
    } catch (error) {
      console.error('Error fetching guests:', error);
      return [];
    }
  },

  async addGuest(guest: Guest): Promise<void> {
    try {
      await guestOperations.create(guest);
    } catch (error) {
      console.error('Error adding guest:', error);
      throw error;
    }
  },

  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<void> {
    try {
      await guestOperations.update(guestId, updates);
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  },

  async deleteGuest(guestId: string): Promise<void> {
    try {
      await guestOperations.delete(guestId);
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  },

  async getGuestByInviteCode(inviteCode: string): Promise<Guest | null> {
    try {
      return await guestOperations.getByInviteCode(inviteCode);
    } catch (error) {
      console.error('Error fetching guest by invite code:', error);
      return null;
    }
  },

  async getGuestsByEventId(eventId: string): Promise<Guest[]> {
    try {
      return await guestOperations.getByEventId(eventId);
    } catch (error) {
      console.error('Error fetching guests by event ID:', error);
      return [];
    }
  },

  // Event operations
  async getEvents(): Promise<Event[]> {
    try {
      return await eventOperations.getAll();
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async addEvent(event: Event): Promise<void> {
    try {
      await eventOperations.create(event);
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await eventOperations.delete(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async getEventById(eventId: string): Promise<Event | null> {
    try {
      return await eventOperations.getById(eventId);
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  }
};