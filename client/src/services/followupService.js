import { api } from "./api";

export const followupService = {
  list: async (params) => {
    const { data } = await api.get("/followups", { params });
    return data.data;
  },
  counts: async () => {
    const { data } = await api.get("/followups/counts");
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/followups", payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/followups/${id}`, payload);
    return data.data;
  },
  complete: async (id, payload) => {
    const { data } = await api.patch(`/followups/${id}/complete`, payload);
    return data.data;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/followups/${id}/cancel`);
    return data.data;
  },
};
