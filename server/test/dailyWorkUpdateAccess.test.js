import assert from "node:assert/strict";

import { buildDefaultPermissions } from "../src/constants/rbac.js";
import { applyScopedFilter } from "../src/utils/accessControl.js";

const user = {
  _id: "507f191e810c19729de860ea",
};

const testCases = [
  [
    "Sales daily work update scope stays own",
    () => {
      const permissions = buildDefaultPermissions("sales");
      assert.equal(permissions.dailyWorkUpdates.scope, "own");
    },
  ],
  [
    "Manager daily work update scope resolves to team",
    () => {
      const permissions = buildDefaultPermissions("manager");
      assert.equal(permissions.dailyWorkUpdates.scope, "team");
    },
  ],
  [
    "Admin and Super Admin daily work update scope stays all",
    () => {
      assert.equal(buildDefaultPermissions("admin").dailyWorkUpdates.scope, "all");
      assert.equal(buildDefaultPermissions("super-admin").dailyWorkUpdates.scope, "all");
    },
  ],
  [
    "Team scope builds filters against the managerId resolver",
    () => {
      const scopedFilter = applyScopedFilter({}, "team", user, {
        team: ["managerId"],
        own: ["userId"],
      });

      assert.deepEqual(scopedFilter, {
        $or: [{ managerId: user._id }],
      });
    },
  ],
  [
    "Own scope builds filters against the userId resolver",
    () => {
      const scopedFilter = applyScopedFilter({}, "own", user, {
        team: ["managerId"],
        own: ["userId"],
      });

      assert.deepEqual(scopedFilter, {
        $or: [{ userId: user._id }],
      });
    },
  ],
];

testCases.forEach(([label, run]) => {
  run();
  console.log(`ok - ${label}`);
});
