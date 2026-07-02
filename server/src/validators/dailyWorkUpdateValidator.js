import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "./common.js";

const createStatuses = ["Draft", "Submitted"];
const updateStatuses = ["Draft", "Submitted", "Reviewed"];

export const validateDailyWorkUpdateCreateInput = (payload) => {
  const errors = {};

  const sanitized = {
    userId: validateObjectId(errors, "userId", payload.userId, {
      label: "User",
      required: false,
    }) || undefined,
    reportDate: validateDate(errors, "reportDate", payload.reportDate, {
      label: "Report date",
      required: false,
    }) || undefined,
    achievements: validateRequiredText(errors, "achievements", payload.achievements, {
      label: "Today's achievement",
      min: 3,
      max: 3000,
    }),
    pendingWork: validateRequiredText(errors, "pendingWork", payload.pendingWork, {
      label: "Pending work",
      min: 3,
      max: 3000,
    }),
    tomorrowPlan: validateRequiredText(errors, "tomorrowPlan", payload.tomorrowPlan, {
      label: "Tomorrow's plan",
      min: 3,
      max: 3000,
    }),
    blockers: validateOptionalText(errors, "blockers", payload.blockers, {
      label: "Need help / blockers",
      max: 2000,
    }) || "",
    additionalNotes: validateOptionalText(errors, "additionalNotes", payload.additionalNotes, {
      label: "Additional notes",
      max: 2000,
    }) || "",
    status:
      validateEnum(errors, "status", payload.status || "Draft", {
        label: "Status",
        values: createStatuses,
        required: false,
      }) || "Draft",
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateDailyWorkUpdateUpdateInput = (payload) => {
  const errors = {};
  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "achievements")) {
    sanitized.achievements = validateRequiredText(errors, "achievements", payload.achievements, {
      label: "Today's achievement",
      min: 3,
      max: 3000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "pendingWork")) {
    sanitized.pendingWork = validateRequiredText(errors, "pendingWork", payload.pendingWork, {
      label: "Pending work",
      min: 3,
      max: 3000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "tomorrowPlan")) {
    sanitized.tomorrowPlan = validateRequiredText(errors, "tomorrowPlan", payload.tomorrowPlan, {
      label: "Tomorrow's plan",
      min: 3,
      max: 3000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "blockers")) {
    sanitized.blockers = validateOptionalText(errors, "blockers", payload.blockers, {
      label: "Need help / blockers",
      max: 2000,
    }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "additionalNotes")) {
    sanitized.additionalNotes = validateOptionalText(errors, "additionalNotes", payload.additionalNotes, {
      label: "Additional notes",
      max: 2000,
    }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "managerComment")) {
    sanitized.managerComment = validateOptionalText(errors, "managerComment", payload.managerComment, {
      label: "Manager comment",
      max: 2000,
    }) || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    sanitized.status = validateEnum(errors, "status", payload.status, {
      label: "Status",
      values: updateStatuses,
    });
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateDailyWorkUpdateListQuery = (payload) => {
  const errors = {};

  const sanitized = {
    userId: validateObjectId(errors, "userId", payload.userId, {
      label: "User",
      required: false,
    }) || undefined,
    status:
      validateEnum(errors, "status", payload.status, {
        label: "Status",
        values: updateStatuses,
        required: false,
      }) || undefined,
    reportDate: validateDate(errors, "reportDate", payload.reportDate, {
      label: "Report date",
      required: false,
    }) || undefined,
    dateFrom: validateDate(errors, "dateFrom", payload.dateFrom, {
      label: "From date",
      required: false,
    }) || undefined,
    dateTo: validateDate(errors, "dateTo", payload.dateTo, {
      label: "To date",
      required: false,
    }) || undefined,
    page: payload.page,
    limit: payload.limit,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
