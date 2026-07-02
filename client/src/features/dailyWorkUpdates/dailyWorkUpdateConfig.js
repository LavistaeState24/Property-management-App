export const dailyWorkUpdateStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Reviewed", label: "Reviewed" },
];

export const getDailyWorkUpdateStatusTone = (status) => {
  if (status === "Reviewed") {
    return "green";
  }

  if (status === "Submitted") {
    return "gold";
  }

  return "slate";
};

export const getDailyWorkUpdateReviewStatus = (dailyWorkUpdate) => {
  if (dailyWorkUpdate?.status === "Reviewed" || dailyWorkUpdate?.reviewedAt) {
    return "Reviewed";
  }

  if (dailyWorkUpdate?.status === "Submitted") {
    return "Pending Review";
  }

  return "Not Submitted";
};

export const getDailyWorkUpdateReviewTone = (dailyWorkUpdate) => {
  const reviewStatus = getDailyWorkUpdateReviewStatus(dailyWorkUpdate);

  if (reviewStatus === "Reviewed") {
    return "green";
  }

  if (reviewStatus === "Pending Review") {
    return "amber";
  }

  return "slate";
};

export const formatDailyWorkUpdateDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";

export const formatDailyWorkUpdateDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const getDailyWorkUpdateOwnerId = (dailyWorkUpdate) =>
  String(dailyWorkUpdate?.userId?._id || dailyWorkUpdate?.userId || "");

export const canEditDailyWorkUpdate = (dailyWorkUpdate, currentUser, canUpdate) => {
  if (!dailyWorkUpdate || !currentUser || !canUpdate) {
    return false;
  }

  const ownerId = getDailyWorkUpdateOwnerId(dailyWorkUpdate);
  const currentUserId = String(currentUser.id || currentUser._id || "");
  const isOwner = ownerId === currentUserId;

  if (currentUser.role === "sales") {
    return isOwner && dailyWorkUpdate.status !== "Reviewed";
  }

  if (currentUser.role === "manager") {
    return true;
  }

  if (currentUser.role === "super-admin") {
    return true;
  }

  return false;
};
