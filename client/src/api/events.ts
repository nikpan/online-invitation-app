import apiClient from './client';
import type { Event, RsvpStatus } from '../types';

export interface CreateEventInput {
  title: string;
  description?: string | null;
  event_date: string;
  event_end_date?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  theme?: 'confetti' | 'elegant' | 'neon';
  max_guests?: number | null;
  is_public?: boolean;
  rsvp_deadline?: string | null;
  slug?: string;
}

export type UpdateEventInput = Partial<CreateEventInput> & { cover_image_url?: string | null };

export interface GuestCounts {
  total: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
}

export type EventWithCounts = Event & { guest_counts: GuestCounts };

interface ListResponse {
  events: EventWithCounts[];
}

interface OneResponse {
  event: Event;
}

interface PublicResponse {
  event: Event;
  attending_count: number;
}

interface CoverResponse {
  cover_image_url: string;
}

export const eventsApi = {
  listMine: () => apiClient.get<ListResponse>('/events/mine'),

  get: (id: string) => apiClient.get<OneResponse>(`/events/${id}`),

  create: (data: CreateEventInput) => apiClient.post<OneResponse>('/events', data),

  update: (id: string, data: UpdateEventInput) =>
    apiClient.put<OneResponse>(`/events/${id}`, data),

  publish: (id: string) => apiClient.post<OneResponse>(`/events/${id}/publish`),
  close: (id: string) => apiClient.post<OneResponse>(`/events/${id}/close`),
  reopen: (id: string) => apiClient.post<OneResponse>(`/events/${id}/reopen`),
  archive: (id: string) => apiClient.post<OneResponse>(`/events/${id}/archive`),

  delete: (id: string) => apiClient.delete<void>(`/events/${id}`),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<CoverResponse>(`/events/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getPublic: (slug: string) => apiClient.get<PublicResponse>(`/events/public/${slug}`),
};

export type { RsvpStatus };
