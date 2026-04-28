import { ShareLink } from "../models/ShareLink.js";
import { ApiError } from "../utils/ApiError.js";

const defaultClientFields = [
  "publicAlias",
  "location",
  "propertyType",
  "configuration",
  "sizeRange",
  "priceRange",
  "possessionDate",
  "amenities",
  "brochure",
  "hasSampleVideo",
  "sampleVideoUrl",
  "projectImages",
  "status",
];

export const createShareLink = async (payload, userId) =>
  ShareLink.create({
    project: payload.projectId,
    sharedWithClientName: payload.sharedWithClientName,
    selectedFields: payload.selectedFields?.length
      ? payload.selectedFields
      : defaultClientFields,
    createdBy: userId,
    expiresAt: payload.expiresAt,
  });

export const getShareLinkPreview = async (token) => {
  const shareLink = await ShareLink.findOne({ token }).populate("project");

  if (!shareLink) {
    throw new ApiError(404, "Share link not found");
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw new ApiError(410, "Share link expired");
  }

  const safePayload = shareLink.selectedFields.reduce((acc, field) => {
    acc[field] = shareLink.project[field];
    return acc;
  }, {});

  safePayload.whatsAppMessage = [
    `Property Match: ${shareLink.project.publicAlias}`,
    `Area: ${shareLink.project.location}`,
    `Type: ${shareLink.project.configuration || shareLink.project.propertyType}`,
    `Budget: ${shareLink.project.priceRange?.min || "-"} - ${shareLink.project.priceRange?.max || "-"}`,
    `Possession: ${shareLink.project.possessionDate ? new Date(shareLink.project.possessionDate).toLocaleDateString("en-IN") : "On request"}`,
  ].join("\n");

  return {
    id: shareLink._id,
    token: shareLink.token,
    sharedWithClientName: shareLink.sharedWithClientName,
    project: safePayload,
  };
};
