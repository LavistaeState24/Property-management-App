import { api } from "./api";
import { fetchAllPaginated } from "./paginatedList";
import { toast } from "../utils/toast";

export const dailyWorkUpdateService = {
  list: async (params) => {
    const { data } = await api.get("/daily-work-updates", { params });
    return data.data;
  },
  listAll: async (params) => fetchAllPaginated((requestParams) => dailyWorkUpdateService.list(requestParams), params),
  getCurrent: async (params) => {
    const { data } = await api.get("/daily-work-updates/current", { params });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/daily-work-updates", payload);
    toast.success("Daily work update saved successfully");
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/daily-work-updates/${id}`);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/daily-work-updates/${id}`, payload);
    toast.success("Daily work update updated successfully");
    return data.data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/daily-work-updates/${id}`);
    toast.success("Daily work update deleted successfully");
    return data;
  },
};
