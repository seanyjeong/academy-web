import apiClient from "./client";

export const scoreboardAPI = {
  get: (slug: string, params?: { record_type_id?: number; limit?: number }) =>
    apiClient.get(`/public/scoreboard/${slug}`, { params }),
  scores: (slug: string, params?: { record_type_id?: number; limit?: number }) =>
    apiClient.get(`/public/scoreboard/${slug}/scores`, { params }),
};
