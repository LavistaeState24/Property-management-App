import assert from "node:assert/strict";

import {
  validateDailyWorkUpdateCreateInput,
  validateDailyWorkUpdateUpdateInput,
} from "../src/validators/dailyWorkUpdateValidator.js";
import { normalizeReportDateValue } from "../src/services/dailyWorkUpdateService.js";

const createPayload = {
  achievements: "Spoke with clients and prepared follow-up notes.",
  pendingWork: "Need to complete the pending callbacks.",
  tomorrowPlan: "Plan to close follow-ups and update the pipeline.",
  blockers: "Waiting for confirmation from one prospect.",
  additionalNotes: "Need brochure revision from design team.",
  status: "Submitted",
};

const testCases = [
  [
    "Daily work update create validation accepts the required reporting fields",
    () => {
      const result = validateDailyWorkUpdateCreateInput(createPayload);

      assert.equal(result.achievements, createPayload.achievements);
      assert.equal(result.pendingWork, createPayload.pendingWork);
      assert.equal(result.tomorrowPlan, createPayload.tomorrowPlan);
      assert.equal(result.status, "Submitted");
    },
  ],
  [
    "Daily work update update validation accepts manager comment and reviewed status",
    () => {
      const result = validateDailyWorkUpdateUpdateInput({
        managerComment: "Good progress. Please close the pending callbacks tomorrow.",
        status: "Reviewed",
      });

      assert.equal(result.managerComment, "Good progress. Please close the pending callbacks tomorrow.");
      assert.equal(result.status, "Reviewed");
    },
  ],
  [
    "Daily work update report date normalization collapses the same calendar day to one stored value",
    () => {
      const morningValue = normalizeReportDateValue("2026-06-30T09:15:00+05:30");
      const eveningValue = normalizeReportDateValue("2026-06-30T20:45:00+05:30");

      assert.equal(morningValue.toISOString(), "2026-06-30T00:00:00.000Z");
      assert.equal(eveningValue.toISOString(), "2026-06-30T00:00:00.000Z");
    },
  ],
];

testCases.forEach(([label, run]) => {
  run();
  console.log(`ok - ${label}`);
});
