import assert from "node:assert/strict";

import {
  buildReminderLockOverrideActivity,
  createReminderLockError,
  shouldBlockReminderAction,
} from "../src/utils/reminderLock.js";

const tests = [
  ["Sales users are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("sales", true), true)],
  ["Managers are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("manager", true), true)],
  ["Admins are blocked by the reminder lock", () => assert.equal(shouldBlockReminderAction("admin", true), true)],
  ["Super Admin can bypass the reminder lock", () => assert.equal(shouldBlockReminderAction("super-admin", true), false)],
  [
    "Reminder lock override activity payload is created",
    () => {
      const payload = buildReminderLockOverrideActivity({
        performedBy: "user-1",
        targetId: "lead-1",
      });

      assert.deepEqual(payload, {
        action: "REMINDER_LOCK_OVERRIDDEN",
        module: "reminders",
        performedBy: "user-1",
        targetId: "lead-1",
        leadId: "lead-1",
        message: "Super Admin bypassed overdue reminder lock",
        metadata: {
          bypassed: true,
        },
      });
    },
  ],
  [
    "Reminder lock error uses the required message",
    () => {
      const error = createReminderLockError();

      assert.equal(error.statusCode, 403);
      assert.equal(error.message, "Complete overdue reminder before continuing");
    },
  ],
];

let failures = 0;

for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures) {
  process.exitCode = 1;
  console.error(`\n${failures} test(s) failed`);
} else {
  console.log(`\n${tests.length} test(s) passed`);
}
