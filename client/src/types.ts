export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export type EventStatus = 'draft' | 'published' | 'closed' | 'archived';
export type EventTheme = 'confetti' | 'elegant' | 'neon';

export interface Event {
  id: string;
  host_id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  cover_image_url: string | null;
  theme: EventTheme;
  max_guests: number | null;
  is_public: boolean;
  rsvp_deadline: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export type RsvpStatus = 'pending' | 'attending' | 'declined' | 'maybe';

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: RsvpStatus;
  adult_count: number;
  kid_count: number;
  edit_token: string;
  rsvp_at: string | null;
  message: string | null;
  reminded_at: string | null;
  created_at: string;
}

export interface EventUpdate {
  id: string;
  event_id: string;
  content: string;
  send_email: boolean;
  created_at: string;
}

export interface Rsvp {
  name: string;
  email?: string | null;
  phone?: string | null;
  rsvp_status: RsvpStatus;
  adult_count?: number;
  kid_count?: number;
  message?: string | null;
}
