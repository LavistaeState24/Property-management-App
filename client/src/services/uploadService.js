import { api } from "./api";
import { toast } from "../utils/toast";

export const resolveAssetUrl = (url) => {
  return url || "";
};

export const uploadService = {
  uploadFiles: async (files, options = {}) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const { data } = await api.post("/uploads", formData, {
      onUploadProgress: options.onProgress
        ? (event) => {
            if (!event.total) {
              return;
            }

            options.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });
    toast.success("Files uploaded successfully");

    return data.data;
  },
  uploadLeadPropertyImages: async (files, options = {}) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const { data } = await api.post("/uploads/lead-property-images", formData, {
      onUploadProgress: options.onProgress
        ? (event) => {
            if (!event.total) {
              return;
            }

            options.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });
    toast.success("Property images uploaded successfully");

    return data.data;
  },
  uploadLeadPropertyVideo: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("files", file);

    const { data } = await api.post("/uploads/lead-property-video", formData, {
      onUploadProgress: options.onProgress
        ? (event) => {
            if (!event.total) {
              return;
            }

            options.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });
    toast.success("Property video uploaded successfully");

    return data.data?.[0] || null;
  },
};
