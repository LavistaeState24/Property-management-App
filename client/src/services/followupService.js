import { api } from "./api";

export const followupService = {
  list: async (params) => {
    const { data } = await api.get("/followups", { params });
    return data.data;
  },
};

