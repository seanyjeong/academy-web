import apiClient from "./client";

export const scoreboardAPI = {
  get: (slug: string) => apiClient.get(`/public/scoreboard/${slug}`),
  scores: (slug: string) => apiClient.get(`/public/scoreboard/${slug}/scores`),
};
