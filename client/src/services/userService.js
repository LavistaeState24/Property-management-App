import { api } from "./api";

export const userService = {
  list: async () => {
    const { data } = await api.get("/users");
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post("/users", payload);
    return data.data;
  },
};
