import {
  KeyRound,
  Mail,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";

import DataTable from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { assignableRoleOptions } from "../../../constants/permissions";
import {
  emailRules,
  getErrorMessage,
  passwordRules,
  phoneRules,
  selectRules,
  textRules,
} from "../../../utils/validation";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function UsersPage({
  users = [],
  canCreateUsers,
  userError,
  userSuccess,
  errors,
  register,
  handleSubmit,
  handleCreateUser,
  isSubmitting,
  selectedUserRole,
  managerOptions,
}) {
  const columns = [
    {
      key: "name",
      label: "User",
      searchValue: (row) =>
        `${row.name || ""} ${row.email || ""} ${row.phone || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-heading">
            {row.name || "-"}
          </p>

          <p className="mt-1 text-sm text-body">
            {row.email || "-"}
          </p>

          <p className="mt-1 text-sm text-body">
            {row.phone || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <span className="rounded-full border border-gold/25 bg-gold-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-gold">
          {row.role || "-"}
        </span>
      ),
    },
    {
      key: "isOnline",
      label: "Status",
      searchValue: (row) =>
        row.isOnline ? "online" : "offline",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            row.isOnline
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              row.isOnline
                ? "bg-emerald-500"
                : "bg-slate-400"
            }`}
          />

          {row.isOnline ? "Online" : "Offline"}
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (row) => formatDateTime(row.lastLoginAt),
    },
    {
      key: "lastSeenAt",
      label: "Last Seen",
      render: (row) => formatDateTime(row.lastSeenAt),
    },
    {
      key: "managerName",
      label: "Manager",
      render: (row) =>
        row.managerName
          ? `Reports to ${row.managerName}`
          : "-",
    },
  ];

  return (
    <div className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-gold" />

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Team Access
          </p>

          <h3 className="mt-2 font-display text-2xl font-medium text-heading">
            Create and review users
          </h3>
        </div>
      </div>

      {canCreateUsers ? (
        <form
          className="mt-5 space-y-4"
          onSubmit={handleSubmit(handleCreateUser)}
        >
          <FormInput
            label="Full Name"
            icon={UserRound}
            error={getErrorMessage(errors.name)}
            {...register(
              "name",
              textRules("Name", {
                min: 3,
                max: 60,
              }),
            )}
          />

          <FormInput
            label="Email"
            type="email"
            icon={Mail}
            error={getErrorMessage(errors.email)}
            {...register("email", emailRules())}
          />

          <FormInput
            label="Phone"
            type="tel"
            icon={Phone}
            error={getErrorMessage(errors.phone)}
            {...register("phone", phoneRules())}
          />

          <FormInput
            label="Password"
            type="password"
            icon={KeyRound}
            error={getErrorMessage(errors.password)}
            {...register("password", passwordRules())}
          />

          <SelectDropdown
            label="Role"
            options={assignableRoleOptions}
            error={getErrorMessage(errors.role)}
            {...register("role", selectRules("Role"))}
          />

          {selectedUserRole === "sales" ? (
            <SelectDropdown
              label="Reporting Manager"
              options={managerOptions}
              placeholder="Select manager"
              error={getErrorMessage(errors.managerId)}
              {...register("managerId")}
            />
          ) : null}

          {userError ? (
            <p className="text-sm text-rose-600">
              {userError}
            </p>
          ) : null}

          {userSuccess ? (
            <p className="text-sm text-emerald-600">
              {userSuccess}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              disabled={isSubmitting}
              icon={UserPlus}
            >
              {isSubmitting
                ? "Creating..."
                : "Create User"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-5 text-sm text-body">
          You can review users here, but only Super Admin can create new accounts.
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={users}
          totalRecords={users.length}
          emptyMessage="No users found."
          searchPlaceholder="Search users..."
          defaultRowsPerPage={10}
        />
      </div>
    </div>
  );
}