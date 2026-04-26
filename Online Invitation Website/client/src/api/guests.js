import apiClient from './client';

export const guestsApi = {
  list: (eventId, params) => apiClient.get(`/events/${eventId}/guests`, { params }),

  add: (eventId, data) => apiClient.post(`/events/${eventId}/guests`, data),

  update: (eventId, guestId, data) =>
    apiClient.put(`/events/${eventId}/guests/${guestId}`, data),

  remove: (eventId, guestId) => apiClient.delete(`/events/${eventId}/guests/${guestId}`),

  rsvp: (slug, data) => apiClient.post(`/events/public/${slug}/rsvp`, data),

  getByToken: (token) => apiClient.get(`/events/rsvp/${token}`),

  editByToken: (token, data) => apiClient.put(`/events/rsvp/${token}`, data),
};
