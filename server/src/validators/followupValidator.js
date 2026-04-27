import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateObjectId,
  validateRequiredText,
} from "./common.js";

const followupTypes = ["call", "meeting", "site visit", "whatsapp", "email"];

export const validateFollowupInput = (payload) => {
  const errors = {};

  const sanitized = {
    client: validateObjectId(errors, "client", payload.client, { label: "Client" }),
    project: validateObjectId(errors, "project", payload.project, { label: "Project", required: false }) || undefined,
    note: validateRequiredText(errors, "note", payload.note, { label: "Note", min: 3, max: 500 }),
    dueDate: validateDate(errors, "dueDate", payload.dueDate, { label: "Follow-up date", required: true }),
    type: validateEnum(errors, "type", payload.type || "call", { label: "Type", values: followupTypes }),
    completed: Boolean(payload.completed),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
