import { api, getApiOrigin } from "./api";

export const resolveAssetUrl = (url) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${getApiOrigin()}${url.startsWith("/") ? url : `/${url}`}`;
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
