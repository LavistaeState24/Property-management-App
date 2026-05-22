import { Followup } from "../models/Followup.js";

export const hasOverdueReminderForLead = async (clientId) => {
  return await Followup.exists({
    client: clientId,
    status: "Pending",
    reminderDateTime: { $lt: new Date() },
  });
};