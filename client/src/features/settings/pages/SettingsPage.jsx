import { Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/common/Button";

import PageSkeleton from "../../../components/common/PageSkeleton";
import SelectDropdown from "../../../components/common/SelectDropdown";
import {
  permissionActions,
  permissionModules,
  roleOptions,
} from "../../../constants/permissions";
import { useCan } from "../../../hooks/useCan";
import { permissionService } from "../../../services/permissionService";
import { userService } from "../../../services/userService";
import { applyServerErrors } from "../../../utils/validation";
import UsersPage from "./UsersPage";

const clonePermissions = (permissions = {}) =>
  JSON.parse(JSON.stringify(permissions));

const toggleToneClasses = {
  view: {
    on: "border-gold/60 bg-gold-soft",
    knob: "bg-gold",
    hover: "hover:border-gold/50",
  },
  create: {
    on: "border-emerald-300 bg-emerald-50",
    knob: "bg-emerald-500",
    hover: "hover:border-emerald-400",
  },
  update: {
    on: "border-sky-300 bg-sky-50",
    knob: "bg-sky-500",
    hover: "hover:border-sky-400",
  },
  delete: {
    on: "border-rose-300 bg-rose-50",
    knob: "bg-rose-500",
    hover: "hover:border-rose-400",
  },
};

function PermissionToggle({
  checked,
  disabled,
  onChange,
  label,
  actionKey,
}) {
  const tone =
    toggleToneClasses[actionKey] || toggleToneClasses.view;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        checked
          ? tone.on
          : "border-border bg-surface-soft"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : tone.hover
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition ${
          checked
            ? `translate-x-6 ${tone.knob}`
            : "translate-x-1 bg-slate-400"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const canManagePermissions = useCan("settings", "update");
  const canViewUsers = useCan("users", "view");
  const canCreateUsers = useCan("users", "create");

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] =
    useState("super-admin");
  const [draftPermissions, setDraftPermissions] = useState({});
  const [users, setUsers] = useState([]);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "sales",
      managerId: "",
    },
  });

  const selectedUserRole = watch("role");

  const activeRole = useMemo(
    () =>
      roles.find((role) => role.key === selectedRole) || null,
    [roles, selectedRole],
  );

  const isRoleEditable = Boolean(
    canManagePermissions &&
      activeRole &&
      activeRole.key !== "super-admin",
  );

  const loadSettings = async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [rolesData, usersData] = await Promise.all([
        permissionService.list(),
        canViewUsers
          ? userService.list()
          : Promise.resolve([]),
      ]);

      setRoles(rolesData);

      setSelectedRole(
        (currentRole) =>
          rolesData.find(
            (role) => role.key === currentRole,
          )?.key ||
          rolesData[0]?.key ||
          "super-admin",
      );

      setUsers(usersData);
    } catch (requestError) {
      setPageError(
        requestError.response?.data?.message ||
          "Unable to load settings",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeRole) {
      setDraftPermissions(
        clonePermissions(activeRole.permissions),
      );
    }
  }, [activeRole]);

  const handlePermissionToggle = (
    moduleKey,
    actionKey,
    checked,
  ) => {
    setSaveError("");
    setSaveSuccess("");

    setDraftPermissions((currentPermissions) => {
      const nextPermissions =
        clonePermissions(currentPermissions);

      const nextModulePermissions = {
        ...nextPermissions[moduleKey],
        [actionKey]: checked,
      };

      if (actionKey === "view" && !checked) {
        nextModulePermissions.create = false;
        nextModulePermissions.update = false;
        nextModulePermissions.delete = false;
      }

      if (actionKey !== "view" && checked) {
        nextModulePermissions.view = true;
      }

      nextPermissions[moduleKey] =
        nextModulePermissions;

      return nextPermissions;
    });
  };

  const handleSavePermissions = async () => {
    if (!activeRole) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const updatedRole =
        await permissionService.update(
          activeRole.key,
          draftPermissions,
        );

      setRoles((currentRoles) =>
        currentRoles.map((role) =>
          role.key === updatedRole.key
            ? updatedRole
            : role,
        ),
      );

      setDraftPermissions(
        clonePermissions(updatedRole.permissions),
      );

      setSaveSuccess(
        `${updatedRole.name} permissions updated successfully.`,
      );
    } catch (requestError) {
      setSaveError(
        requestError.response?.data?.message ||
          "Unable to update role permissions",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (formValues) => {
    setUserError("");
    setUserSuccess("");

    try {
      const payload = {
        ...formValues,
        managerId:
          formValues.role === "sales" &&
          formValues.managerId
            ? formValues.managerId
            : undefined,
      };

      const createdUser =
        await userService.create(payload);

      setUsers((currentUsers) => [
        createdUser,
        ...currentUsers,
      ]);

      setUserSuccess(
        `${createdUser.name} created successfully.`,
      );

      reset({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "sales",
        managerId: "",
      });
    } catch (requestError) {
      applyServerErrors(
        requestError,
        setError,
        setUserError,
      );
    }
  };

  const managerOptions = users
    .filter((managedUser) =>
      ["manager", "admin", "super-admin"].includes(
        managedUser.role,
      ),
    )
    .map((managedUser) => ({
      value: managedUser.id,
      label: `${managedUser.name} (${managedUser.role})`,
    }));

  if (isLoading) {
    return <PageSkeleton variant="settings" />;
  }

  return (
    <div className="space-y-6 text-heading">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
          Settings
        </p>

        <h2 className="mt-2 font-display text-3xl font-medium text-heading">
          Access governance and team controls
        </h2>
      </div>

      {pageError ? (
        <p className="text-sm text-rose-600">
          {pageError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                Role Permissions
              </p>

              <h3 className="mt-2 font-display text-2xl font-medium text-heading">
                Module access matrix
              </h3>
            </div>

            <div className="w-full max-w-xs">
              <SelectDropdown
                label="Role"
                options={roleOptions}
                value={selectedRole}
                onChange={(event) =>
                  setSelectedRole(event.target.value)
                }
              />
            </div>
          </div>

          {activeRole ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-surface-soft px-4 py-3 text-sm text-body">
                <span className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-heading">
                  {activeRole.name}
                </span>

                <span>
                  Scope values stay system-managed to
                  preserve assigned-data rules.
                </span>

                {activeRole.key === "super-admin" ? (
                  <span className="rounded-full border border-gold/30 bg-gold-soft px-3 py-1 font-medium text-gold">
                    Locked full access
                  </span>
                ) : null}
              </div>

              {saveError ? (
                <p className="text-sm text-rose-600">
                  {saveError}
                </p>
              ) : null}

              {saveSuccess ? (
                <p className="text-sm text-emerald-600">
                  {saveSuccess}
                </p>
              ) : null}

              <div className="overflow-x-auto rounded-3xl border border-border">
                <table className="min-w-full divide-y divide-border text-left text-sm">
                  <thead className="bg-surface-soft text-xs uppercase tracking-[0.24em] text-body">
                    <tr>
                      <th className="px-5 py-4">
                        Module
                      </th>

                      <th className="px-5 py-4">
                        Scope
                      </th>

                      {permissionActions.map((action) => (
                        <th
                          key={action}
                          className="px-5 py-4 text-center"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-soft">
                    {permissionModules.map(
                      (moduleItem) => {
                        const modulePermissions =
                          draftPermissions[
                            moduleItem.key
                          ] || {};

                        return (
                          <tr
                            key={moduleItem.key}
                            className="bg-surface transition hover:bg-surface-soft"
                          >
                            <td className="px-5 py-4 font-medium text-heading">
                              {moduleItem.label}
                            </td>

                            <td className="px-5 py-4 text-body">
                              {modulePermissions.scope ||
                                "none"}
                            </td>

                            {permissionActions.map(
                              (actionKey) => (
                                <td
                                  key={actionKey}
                                  className="px-5 py-4 text-center"
                                >
                                  <div className="flex justify-center">
                                    <PermissionToggle
                                      checked={Boolean(
                                        modulePermissions[
                                          actionKey
                                        ],
                                      )}
                                      disabled={
                                        !isRoleEditable ||
                                        (actionKey !==
                                          "view" &&
                                          !modulePermissions.view &&
                                          !modulePermissions[
                                            actionKey
                                          ])
                                      }
                                      onChange={(
                                        nextChecked,
                                      ) =>
                                        handlePermissionToggle(
                                          moduleItem.key,
                                          actionKey,
                                          nextChecked,
                                        )
                                      }
                                      label={`${activeRole.name} ${moduleItem.label} ${actionKey}`}
                                      actionKey={
                                        actionKey
                                      }
                                    />
                                  </div>
                                </td>
                              ),
                            )}
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setDraftPermissions(
                      clonePermissions(
                        activeRole.permissions,
                      ),
                    )
                  }
                  disabled={
                    !isRoleEditable || isSaving
                  }
                >
                  Reset
                </Button>

                <Button
                  type="button"
                  icon={Save}
                  onClick={handleSavePermissions}
                  disabled={
                    !isRoleEditable || isSaving
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : "Save Permissions"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-body">
              No roles found.
            </p>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/20 bg-gold-soft text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                  Guardrails
                </p>

                <h3 className="mt-2 font-display text-2xl font-medium text-heading">
                  Safety rules
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-body">
              <p>
                If view is disabled, create, update, and
                delete are forced off.
              </p>

              <p>
                Super Admin access stays locked so the
                workspace cannot be orphaned accidentally.
              </p>

              <p>
                Backend checks every API request. Hidden
                buttons in the UI are convenience only.
              </p>
            </div>
          </div>

          {canViewUsers ? (
            <UsersPage
              users={users}
              canCreateUsers={canCreateUsers}
              userError={userError}
              userSuccess={userSuccess}
              errors={errors}
              register={register}
              handleSubmit={handleSubmit}
              handleCreateUser={handleCreateUser}
              isSubmitting={isSubmitting}
              selectedUserRole={selectedUserRole}
              managerOptions={managerOptions}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}