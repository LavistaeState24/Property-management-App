import { api } from "./api";

export const shareRecordService = {
  create: async (payload) => {
    const { data } = await api.post("/share-records", payload);
    return data.data;
  },
  list: async () => {
    const { data } = await api.get("/share-records",);
    return data.data;
  },
  listByClientPhone: async (clientPhone) => {
    const { data } = await api.get(`/share-records/client/${clientPhone}`);
    return data.data;
  },
  listByProjectId: async (projectId) => {
    const { data } = await api.get(`/share-records/project/${projectId}`);
    return data.data;
  },
  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/share-records/${id}/status`, payload);
    return data.data;
  },
  updateNotes: async (id, payload) => {
    const { data } = await api.patch(`/share-records/${id}/notes`, payload);
    return data.data;
  },
};
