import apiClient from './client';

export const eventsApi = {
  listMine: () => apiClient.get('/events/mine'),

  get: (id) => apiClient.get(`/events/${id}`),

  create: (data) => apiClient.post('/events', data),

  update: (id, data) => apiClient.put(`/events/${id}`, data),

  publish: (id) => apiClient.post(`/events/${id}/publish`),
  close: (id) => apiClient.post(`/events/${id}/close`),
  reopen: (id) => apiClient.post(`/events/${id}/reopen`),
  archive: (id) => apiClient.post(`/events/${id}/archive`),

  delete: (id) => apiClient.delete(`/events/${id}`),

  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post(`/events/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getPublic: (slug) => apiClient.get(`/events/public/${slug}`),
};
