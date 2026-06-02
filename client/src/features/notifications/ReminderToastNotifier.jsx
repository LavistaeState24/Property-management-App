import { useEffect, useRef } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useCan } from "../../hooks/useCan";
import { followupService } from "../../services/followupService";
import { toast } from "../../utils/toast";

const POLL_INTERVAL_MS = 10000;
const STORAGE_PREFIX = "pmcrm_reminder_toasts_v1";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

const getCacheKey = (userId) => `${STORAGE_PREFIX}:${userId || "anonymous"}`;

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
    if (!user?.id || loading || !canViewFollowups) {
      return;
    }

    notifiedRef.current = readNotifiedIds(user.id);

    const pollDueReminders = async () => {
      if (!activeRef.current || isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      try {
        const data = await followupService.list(
          {
            overdue: "true",
            limit: 100,
          },
          {
            skipToast: true,
          },
        );

        if (!activeRef.current) {
          return;
        }

        const notifiedIds = readNotifiedIds(user.id);
        let hasUpdates = false;

        for (const reminder of data.items || []) {
          const intervalKey = getReminderIntervalKey(reminder);
          if (!reminder?._id || !intervalKey) {
            continue;
          }

          const notificationKey = `${reminder._id}:${intervalKey}`;

          if (notifiedIds[notificationKey]) {
            continue;
          }

          toast.info(buildToastMessage(reminder), {
            id: `reminder-due:${reminder._id}`,
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
  }, [canViewFollowups, loading, user?.id]);

  return null;
}
