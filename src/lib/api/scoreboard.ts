import apiClient from "./client";

export const scoreboardAPI = {
  get: (slug: string) => apiClient.get(`/scoreboard/${slug}`),
  scores: (slug: string) => apiClient.get(`/scoreboard/${slug}/scores`),
};
