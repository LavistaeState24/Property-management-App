import { useEffect } from "react";
import { useForm } from "react-hook-form";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { applyServerErrors, dateRules, getErrorMessage, selectRules, textRules } from "../../../utils/validation";
import { postVisitResultOptions, siteVisitStatusOptions } from "../siteVisitConfig";

const visitTypeOptions = [
  { label: "New Project", value: "New Project" },
  { label: "Resale", value: "Resale" },
  { label: "Rental", value: "Rental" },
  { label: "Commercial", value: "Commercial" },
  { label: "Plot", value: "Plot" },
];

const defaultValues = {
  leadId: "",
  projectId: "",
  visitType: "New Project",
  propertyName: "",
  assignedStaff: "",
  visitDateTime: "",
  pickupRequired: false,
  visitStatus: "Planned",
  clientFeedback: "",
  nextAction: "",
  postVisitResult: "",
};

export default function SiteVisitForm({
  initialValues,
  leadOptions = [],
  projectOptions = [],
  staffOptions = [],
  isSaving = false,
  saveLabel = "Save Site Visit",
  onSubmit,
  onCancel,
  submitIcon: SubmitIcon,
  lockLead = false,
  hideLead = false,
  disabled = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  const visitStatus = watch("visitStatus");
  const visitType = watch("visitType");

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  return (
    <form
  className="space-y-4 sm:space-y-5"
  onSubmit={handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (requestError) {
      applyServerErrors(requestError, setError, () => {});
    }
  })}
>
  {hideLead ? <input type="hidden" {...register("leadId")} /> : null}

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {!hideLead ? (
      <SelectDropdown
        label="Lead"
        options={leadOptions}
        disabled={lockLead || disabled}
        error={getErrorMessage(errors.leadId)}
        {...register("leadId", selectRules("Lead"))}
      />
    ) : null}

    <SelectDropdown
      label="Visit Type"
      options={visitTypeOptions}
      disabled={disabled}
      error={getErrorMessage(errors.visitType)}
      {...register("visitType", selectRules("Visit type"))}
    />

    {visitType === "New Project" ? (
      <SelectDropdown
        label="Project"
        options={projectOptions}
        disabled={disabled}
        error={getErrorMessage(errors.projectId)}
        {...register("projectId", selectRules("Project"))}
      />
    ) : (
      <FormInput
        label="Properties / Locations Shown"
        as="textarea"
        rows={4}
        placeholder={`Example:
Gota 2BHK - ₹25k
Science City 3BHK - ₹32k
Shilaj 2BHK - ₹28k`}
        disabled={disabled}
        error={getErrorMessage(errors.propertyName)}
        {...register(
          "propertyName",
          textRules("Properties / Locations shown", {
            min: 3,
            max: 1000,
            required: true,
          }),
        )}
      />
    )}

    <SelectDropdown
      label="Assigned Staff"
      options={staffOptions}
      disabled={disabled}
      error={getErrorMessage(errors.assignedStaff)}
      {...register("assignedStaff", selectRules("Assigned staff"))}
    />

    <FormInput
      label="Visit Date/Time"
      type="datetime-local"
      disabled={disabled}
      error={getErrorMessage(errors.visitDateTime)}
      {...register(
        "visitDateTime",
        dateRules("Visit date/time", { required: true }),
      )}
    />

    <SelectDropdown
      label="Visit Status"
      options={siteVisitStatusOptions}
      disabled={disabled}
      error={getErrorMessage(errors.visitStatus)}
      {...register("visitStatus", selectRules("Visit status"))}
    />

    <SelectDropdown
      label="Post Visit Result"
      options={postVisitResultOptions}
      disabled={disabled}
      error={getErrorMessage(errors.postVisitResult)}
      {...register("postVisitResult")}
    />
  </div>

  <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-3 text-sm font-semibold text-heading transition hover:border-gold/40 sm:p-4">
    <input
      type="checkbox"
      className="h-4 w-4 accent-gold"
      disabled={disabled}
      {...register("pickupRequired")}
    />
    Pickup required
  </label>

  <FormInput
    label="Client Feedback"
    as="textarea"
    rows={4}
    placeholder={
      visitStatus === "Done"
        ? "Required when visit is done"
        : "Optional feedback"
    }
    disabled={disabled}
    error={getErrorMessage(errors.clientFeedback)}
    {...register("clientFeedback", {
      ...textRules("Client feedback", {
        min: 3,
        max: 1000,
        required: false,
      }),
      validate: (value) =>
        visitStatus !== "Done" ||
        (String(value || "").trim().length >= 3
          ? true
          : "Client feedback is required"),
    })}
  />

  <FormInput
    label="Next Action"
    as="textarea"
    rows={3}
    placeholder={
      visitStatus === "Done"
        ? "Required when visit is done"
        : "Optional next action"
    }
    disabled={disabled}
    error={getErrorMessage(errors.nextAction)}
    {...register("nextAction", {
      ...textRules("Next action", {
        min: 3,
        max: 500,
        required: false,
      }),
      validate: (value) =>
        visitStatus !== "Done" ||
        (String(value || "").trim().length >= 3
          ? true
          : "Next action is required"),
    })}
  />

  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
    {onCancel ? (
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={onCancel}
        disabled={isSaving}
      >
        Cancel
      </Button>
    ) : null}

    <Button
      type="submit"
      className="w-full sm:w-auto"
      icon={SubmitIcon}
      disabled={isSaving || disabled}
    >
      {isSaving ? "Saving..." : saveLabel}
    </Button>
  </div>
</form>
  );
}