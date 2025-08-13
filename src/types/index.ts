export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  inviteCode: string;
  isPresent: boolean;
  checkedInAt?: Date;
  eventId: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  createdAt: Date;
}

export interface QRData {
  guestId: string;
  eventId: string;
  inviteCode: string;
}