import { api } from "./api";

export const clientService = {
  list: async (params) => {
    const { data } = await api.get("/clients", { params });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/clients", payload);
    return data.data;
  },
};

