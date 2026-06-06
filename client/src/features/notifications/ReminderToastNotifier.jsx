import { useEffect, useRef } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useCan } from "../../hooks/useCan";
import { followupService } from "../../services/followupService";
import { shareRecordService } from "../../services/shareRecordService";
import { toast } from "../../utils/toast";

const POLL_INTERVAL_MS = 10000;
const STORAGE_PREFIX = "pmcrm_reminder_toasts_v1";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

const getCacheKey = (userId) => `${STORAGE_PREFIX}:${userId || "anonymous"}`;

const isShareRecordTerminal = (record) => ["closed", "not-interested"].includes(String(record?.status || "").toLowerCase());

const readNotifiedIds = (userId) => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (_error) {
    return {};
  }
};

const writeNotifiedIds = (userId, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(userId), JSON.stringify(value));
  } catch (_error) {
    // Ignore quota or storage failures. The poller will still avoid repeats in-memory.
  }
};

const getReminderIntervalKey = (reminder) => {
  const dueValue = reminder.reminderDateTime || reminder.dueDate;
  if (!dueValue) return null;

  const dueTime = new Date(dueValue).getTime();
  if (Number.isNaN(dueTime)) return null;

  const diffMinutes = Math.floor((Date.now() - dueTime) / 60000);

  if (diffMinutes < 0) return null;
  if (diffMinutes < 15) return "due";
  if (diffMinutes < 30) return "15m";
  if (diffMinutes < 60) return "30m";

  const hourBucket = Math.floor(diffMinutes / 60);
  return `hour-${hourBucket}`;
};

const getShareRecordIntervalKey = (record) => {
  const dueValue = record?.followUpDate;
  if (!dueValue) return null;

  const dueTime = new Date(dueValue).getTime();
  if (Number.isNaN(dueTime)) return null;

  const diffMinutes = Math.floor((Date.now() - dueTime) / 60000);

  if (diffMinutes < 0) return null;
  if (diffMinutes < 15) return "due";
  if (diffMinutes < 30) return "15m";
  if (diffMinutes < 60) return "30m";

  const hourBucket = Math.floor(diffMinutes / 60);
  return `hour-${hourBucket}`;
};

const getReminderOrigin = (reminder) => {
  if (reminder?.relatedModule === "shareRecord" && reminder.relatedId) {
    return { source: "shareRecord", originId: String(reminder.relatedId) };
  }

  return { source: "followup", originId: String(reminder?._id || "") };
};

const buildShareRecordToastMessage = (record) => {
  const leadName = record?.clientName || "Lead";
  const type = String(record?.shareChannel || "WhatsApp") === "Copy" ? "Details Send" : "WhatsApp";
  const dueAt = formatDateTime(record?.followUpDate);
  const note = " - Follow up after shared project details";

  return `${type} reminder due for ${leadName} at ${dueAt}${note}`;
};

const buildToastMessage = (reminder) => {
  const leadName = reminder.client?.ownerName || "Lead";
  const type = reminder.reminderType || "Reminder";
  const dueAt = formatDateTime(reminder.reminderDateTime || reminder.dueDate);
  const note = reminder.note ? ` - ${reminder.note}` : "";

  return `${type} reminder due for ${leadName} at ${dueAt}${note}`;
};

export default function ReminderToastNotifier() {
  const { user, loading } = useAuth();
  const canViewFollowups = useCan("followups", "view");
  const canViewShareRecords = useCan("shareRecords", "view");
  const isPollingRef = useRef(false);
  const activeRef = useRef(true);
  const notifiedRef = useRef({});

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id || loading || (!canViewFollowups && !canViewShareRecords)) {
      return;
    }

    notifiedRef.current = readNotifiedIds(user.id);

    const pollDueReminders = async () => {
      if (!activeRef.current || isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      try {
        const [followupResult, shareRecords] = await Promise.all([
          canViewFollowups
            ? followupService.list(
                {
                  overdue: "true",
                  limit: 100,
                },
                {
                  skipToast: true,
                },
              )
            : Promise.resolve({ items: [] }),
          canViewShareRecords
            ? shareRecordService.list({
                skipToast: true,
              })
            : Promise.resolve([]),
        ]);

        if (!activeRef.current) {
          return;
        }

        const notifiedIds = readNotifiedIds(user.id);
        let hasUpdates = false;

        for (const reminder of followupResult.items || []) {
          const { source, originId } = getReminderOrigin(reminder);
          const intervalKey = getReminderIntervalKey(reminder);
          if (!reminder?._id || !intervalKey) {
            continue;
          }

          const notificationKey = `${source}:${originId}:${intervalKey}`;

          if (notifiedIds[notificationKey]) {
            continue;
          }

          toast.info(buildToastMessage(reminder), {
            id: `reminder-due:${source}:${originId}`,
            duration: 10000,
          });

          notifiedIds[notificationKey] = {
            reminderId: reminder._id,
            intervalKey,
            dueAt: reminder.reminderDateTime || reminder.dueDate || null,
            remindedAt: Date.now(),
          };
          hasUpdates = true;
        }

        for (const record of shareRecords || []) {
          if (!record?._id || isShareRecordTerminal(record)) {
            continue;
          }

          const intervalKey = getShareRecordIntervalKey(record);
          if (!intervalKey) {
            continue;
          }

          const notificationKey = `shareRecord:${record._id}:${intervalKey}`;

          if (notifiedIds[notificationKey]) {
            continue;
          }

          toast.info(buildShareRecordToastMessage(record), {
            id: `reminder-due:shareRecord:${record._id}`,
            duration: 10000,
          });

          notifiedIds[notificationKey] = {
            reminderId: record._id,
            intervalKey,
            dueAt: record.followUpDate || null,
            remindedAt: Date.now(),
          };
          hasUpdates = true;
        }

        if (hasUpdates) {
          notifiedRef.current = notifiedIds;
          writeNotifiedIds(user.id, notifiedIds);
        }
      } catch (_error) {
        // Background polling should fail quietly to avoid noisy user-facing errors.
      } finally {
        isPollingRef.current = false;
      }
    };

    pollDueReminders();
    const intervalId = window.setInterval(pollDueReminders, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canViewFollowups, canViewShareRecords, loading, user?.id]);

  return null;
}
