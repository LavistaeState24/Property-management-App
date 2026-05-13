import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";

export const clientService = {
  list: async (params) => {
    const { data } = await api.get("/clients", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => clientService.list(requestParams), params),
  create: async (payload) => {
    const { data } = await api.post("/clients", payload);
    return data.data;
  },
  importLeads: async (payload) => {
    const { data } = await api.post("/clients/import", payload);
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, payload);
    return data.data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/clients/${id}`);
    return data;
  },
};
