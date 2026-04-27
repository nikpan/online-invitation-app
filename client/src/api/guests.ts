import apiClient from './client';
import type { Guest, Rsvp, RsvpStatus, Event } from '../types';

export interface ListGuestsParams {
  status?: RsvpStatus;
  page?: number;
  limit?: number;
}

export interface AddGuestInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  rsvp_status?: RsvpStatus;
  adult_count?: number;
  kid_count?: number;
  message?: string | null;
}

export type UpdateGuestInput = Partial<AddGuestInput>;

interface ListResponse {
  guests: Guest[];
  total: number;
  page: number;
  pages: number;
}

interface OneResponse {
  guest: Guest;
}

interface RsvpResponse {
  guest: Guest;
  edit_token: string;
}

interface TokenResponse {
  guest: Guest;
  event: Event;
}

export const guestsApi = {
  list: (eventId: string, params?: ListGuestsParams) =>
    apiClient.get<ListResponse>(`/events/${eventId}/guests`, { params }),

  add: (eventId: string, data: AddGuestInput) =>
    apiClient.post<OneResponse>(`/events/${eventId}/guests`, data),

  update: (eventId: string, guestId: string, data: UpdateGuestInput) =>
    apiClient.put<OneResponse>(`/events/${eventId}/guests/${guestId}`, data),

  remove: (eventId: string, guestId: string) =>
    apiClient.delete<void>(`/events/${eventId}/guests/${guestId}`),

  rsvp: (slug: string, data: Rsvp) =>
    apiClient.post<RsvpResponse>(`/events/public/${slug}/rsvp`, data),

  getByToken: (token: string) => apiClient.get<TokenResponse>(`/events/rsvp/${token}`),

  editByToken: (token: string, data: Partial<Rsvp>) =>
    apiClient.put<OneResponse>(`/events/rsvp/${token}`, data),
};
