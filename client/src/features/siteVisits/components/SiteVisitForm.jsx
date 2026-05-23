import { useEffect } from "react";
import { useForm } from "react-hook-form";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { applyServerErrors, dateRules, getErrorMessage, selectRules, textRules } from "../../../utils/validation";
import { postVisitResultOptions, siteVisitStatusOptions } from "../siteVisitConfig";

const defaultValues = {
  leadId: "",
  projectId: "",
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
}) {
  console.log("Project options in SiteVisitForm:", projectOptions.length, projectOptions)
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
            disabled={lockLead}
            error={getErrorMessage(errors.leadId)}
            {...register("leadId", selectRules("Lead"))}
          />
        ) : null}
        <SelectDropdown
          label="Project"
          options={projectOptions}
          error={getErrorMessage(errors.projectId)}
          {...register("projectId", selectRules("Project"))}
        />
        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          error={getErrorMessage(errors.assignedStaff)}
          {...register("assignedStaff", selectRules("Assigned staff"))}
        />
        <FormInput
          label="Visit Date/Time"
          type="datetime-local"
          error={getErrorMessage(errors.visitDateTime)}
          {...register("visitDateTime", dateRules("Visit date/time", { required: true }))}
        />
        <SelectDropdown
          label="Visit Status"
          options={siteVisitStatusOptions}
          error={getErrorMessage(errors.visitStatus)}
          {...register("visitStatus", selectRules("Visit status"))}
        />
        <SelectDropdown
          label="Post Visit Result"
          options={postVisitResultOptions}
          error={getErrorMessage(errors.postVisitResult)}
          {...register("postVisitResult")}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-ivory sm:p-4">
        <input type="checkbox" className="h-4 w-4 accent-gold" {...register("pickupRequired")} />
        Pickup required
      </label>

      <FormInput
        label="Client Feedback"
        as="textarea"
        rows={4}
        placeholder={visitStatus === "Done" ? "Required when visit is done" : "Optional feedback"}
        error={getErrorMessage(errors.clientFeedback)}
        {...register("clientFeedback", {
          ...textRules("Client feedback", { min: 3, max: 1000, required: false }),
          validate: (value) =>
            visitStatus !== "Done" || (String(value || "").trim().length >= 3 ? true : "Client feedback is required"),
        })}
      />

      <FormInput
        label="Next Action"
        as="textarea"
        rows={3}
        placeholder={visitStatus === "Done" ? "Required when visit is done" : "Optional next action"}
        error={getErrorMessage(errors.nextAction)}
        {...register("nextAction", {
          ...textRules("Next action", { min: 3, max: 500, required: false }),
          validate: (value) => (visitStatus !== "Done" || (String(value || "").trim().length >= 3 ? true : "Next action is required")),
        })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="w-full sm:w-auto" icon={SubmitIcon} disabled={isSaving}>
          {isSaving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </form>
  );
}
