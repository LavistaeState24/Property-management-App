import { api } from "./api";

export const resolveAssetUrl = (url) => {
  return url || "";
};

export const uploadService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const { data } = await api.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data.data;
  },
};
