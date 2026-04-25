import { api } from "./api";

export const projectService = {
  list: async (params) => {
    const { data } = await api.get("/projects", { params });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/projects", payload);
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  },
  dashboardSummary: async () => {
    const { data } = await api.get("/projects/dashboard-summary");
    return data.data;
  },
};

