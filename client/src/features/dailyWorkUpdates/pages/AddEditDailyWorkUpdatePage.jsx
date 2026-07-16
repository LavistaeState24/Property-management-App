import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { dailyWorkUpdateService } from "../../../services/dailyWorkUpdateService";
import { applyServerErrors, getErrorMessage, textRules } from "../../../utils/validation";
import { formatDailyWorkUpdateDate, getDailyWorkUpdateOwnerId } from "../dailyWorkUpdateConfig";

const emptyFormValues = {
  achievements: "",
  pendingWork: "",
  tomorrowPlan: "",
  blockers: "",
  additionalNotes: "",
  managerComment: "",
};

const getTodayDateValue = () => {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

export default function AddEditDailyWorkUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateDailyWorkUpdates = useCan("dailyWorkUpdates", "create");
  const canUpdateDailyWorkUpdates = useCan("dailyWorkUpdates", "update");
  const [dailyWorkUpdate, setDailyWorkUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(id) || canCreateDailyWorkUpdates);
  const [pageError, setPageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        if (id) {
          const data = await dailyWorkUpdateService.getById(id);
          setDailyWorkUpdate(data);
          reset({
            achievements: data.achievements || "",
            pendingWork: data.pendingWork || "",
            tomorrowPlan: data.tomorrowPlan || "",
            blockers: data.blockers || "",
            additionalNotes: data.additionalNotes || "",
            managerComment: data.managerComment || "",
          });
          return;
        }

        if (canCreateDailyWorkUpdates) {
          const currentReport = await dailyWorkUpdateService.getCurrent({ reportDate: getTodayDateValue() });

          if (currentReport?._id) {
            navigate(`/daily-work-updates/${currentReport._id}/edit`, { replace: true });
            return;
          }
        }

        reset(emptyFormValues);
        setDailyWorkUpdate(null);
      } catch (requestError) {
        setPageError(requestError.response?.data?.message || "Unable to load daily work update");
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [canCreateDailyWorkUpdates, id, navigate, reset]);

  const isOwner = useMemo(() => {
    if (!dailyWorkUpdate) {
      return true;
    }

    return getDailyWorkUpdateOwnerId(dailyWorkUpdate) === String(user?.id || user?._id || "");
  }, [dailyWorkUpdate, user?.id, user?._id]);

  const canEditContent = !dailyWorkUpdate
    ? canCreateDailyWorkUpdates
    : canUpdateDailyWorkUpdates &&
      (isOwner || user?.role === "super-admin") &&
      (dailyWorkUpdate.status !== "Reviewed" || user?.role === "super-admin");

  const canReviewReport = Boolean(
    dailyWorkUpdate &&
    canUpdateDailyWorkUpdates &&
    !isOwner &&
    ["manager", "super-admin"].includes(user?.role)
  );

  const saveReport = async (formValues, status) => {
    setPageError("");
    setIsSaving(true);

    try {
      const payload = {
        achievements: formValues.achievements,
        pendingWork: formValues.pendingWork,
        tomorrowPlan: formValues.tomorrowPlan,
        blockers: formValues.blockers || "",
        additionalNotes: formValues.additionalNotes || "",
        status,
      };

      if (dailyWorkUpdate) {
        await dailyWorkUpdateService.update(dailyWorkUpdate._id, payload);
      } else {
        await dailyWorkUpdateService.create({
          ...payload,
          reportDate: getTodayDateValue(),
        });
      }

      navigate("/daily-work-updates");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setPageError);
    } finally {
      setIsSaving(false);
    }
  };

  const saveManagerReview = async (formValues, markReviewed = false) => {
    if (!dailyWorkUpdate) {
      return;
    }

    setPageError("");
    setIsSaving(true);

    try {
      const payload = {
        managerComment: formValues.managerComment || "",
      };

      if (markReviewed) {
        payload.status = "Reviewed";
      }

      await dailyWorkUpdateService.update(dailyWorkUpdate._id, payload);
      navigate("/daily-work-updates");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setPageError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (id && !dailyWorkUpdate) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{pageError || "Daily work update not found."}</p>
        <Link to="/daily-work-updates">
          <Button type="button" variant="secondary" icon={ArrowLeft}>
            Back to Daily Work Updates
          </Button>
        </Link>
      </div>
    );
  }

  const reportDateLabel = formatDailyWorkUpdateDate(dailyWorkUpdate?.reportDate || getTodayDateValue());

  return (
    <div className="space-y-6">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">
        Daily Work Updates
      </p>

      <h2 className="mt-2 font-display text-3xl text-heading">
        {dailyWorkUpdate
          ? "Edit and review work update"
          : "Create today's work update"}
      </h2>

      <p className="mt-2 text-sm text-body">
        {dailyWorkUpdate?.userId?.name
          ? `${dailyWorkUpdate.userId.name} • `
          : ""}
        {reportDateLabel}
      </p>
    </div>

    <Link
      to={
        dailyWorkUpdate
          ? `/daily-work-updates/${dailyWorkUpdate._id}`
          : "/daily-work-updates"
      }
    >
      <Button
        type="button"
        variant="secondary"
        icon={ArrowLeft}
      >
        Back
      </Button>
    </Link>
  </div>

  {pageError ? (
    <p className="text-sm text-rose-600">
      {pageError}
    </p>
  ) : null}

  <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
    <section className="rounded-[32px] border border-border bg-surface p-6 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Report Form
          </p>

          <h3 className="mt-2 font-display text-2xl text-heading">
            Daily contribution summary
          </h3>
        </div>

        <span className="rounded-full border border-border bg-surface-soft px-3 py-1 text-sm text-body">
          {reportDateLabel}
        </span>
      </div>

      {canEditContent ? (
        <form className="mt-6 space-y-4">
          <FormInput
            label="Today's Achievement"
            as="textarea"
            rows={5}
            error={getErrorMessage(errors.achievements)}
            {...register(
              "achievements",
              textRules("Today's achievement", {
                min: 3,
                max: 3000,
              }),
            )}
          />

          <FormInput
            label="Pending Work"
            as="textarea"
            rows={5}
            error={getErrorMessage(errors.pendingWork)}
            {...register(
              "pendingWork",
              textRules("Pending work", {
                min: 3,
                max: 3000,
              }),
            )}
          />

          <FormInput
            label="Tomorrow's Plan"
            as="textarea"
            rows={5}
            error={getErrorMessage(errors.tomorrowPlan)}
            {...register(
              "tomorrowPlan",
              textRules("Tomorrow's plan", {
                min: 3,
                max: 3000,
              }),
            )}
          />

          <FormInput
            label="Need Help / Blockers"
            as="textarea"
            rows={4}
            error={getErrorMessage(errors.blockers)}
            {...register(
              "blockers",
              textRules("Need help / blockers", {
                min: 0,
                max: 2000,
                required: false,
              }),
            )}
          />

          <FormInput
            label="Additional Notes"
            as="textarea"
            rows={4}
            error={getErrorMessage(errors.additionalNotes)}
            {...register(
              "additionalNotes",
              textRules("Additional notes", {
                min: 0,
                max: 2000,
                required: false,
              }),
            )}
          />

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              icon={Save}
              disabled={isSaving}
              onClick={handleSubmit((formValues) =>
                saveReport(formValues, "Draft"),
              )}
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              type="button"
              icon={CheckCircle2}
              disabled={isSaving}
              onClick={handleSubmit((formValues) =>
                saveReport(formValues, "Submitted"),
              )}
            >
              {isSaving
                ? "Submitting..."
                : "Submit Report"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          {[
            [
              "Today's Achievement",
              dailyWorkUpdate?.achievements,
            ],
            ["Pending Work", dailyWorkUpdate?.pendingWork],
            [
              "Tomorrow's Plan",
              dailyWorkUpdate?.tomorrowPlan,
            ],
            [
              "Need Help / Blockers",
              dailyWorkUpdate?.blockers,
            ],
            [
              "Additional Notes",
              dailyWorkUpdate?.additionalNotes,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-border bg-surface-soft p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-body">
                {label}
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-heading">
                {value || "Not added"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>

    <section className="space-y-6">
      <div className="rounded-[32px] border border-border bg-surface p-6 shadow-md">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">
          Report Status
        </p>

        <div className="mt-4 space-y-3 text-sm text-body">
          <p>
            Status:{" "}
            <span className="text-heading">
              {dailyWorkUpdate?.status || "Draft"}
            </span>
          </p>

          <p>
            Employee:{" "}
            <span className="text-heading">
              {dailyWorkUpdate?.userId?.name ||
                user?.name ||
                "-"}
            </span>
          </p>

          <p>
            Manager:{" "}
            <span className="text-heading">
              {dailyWorkUpdate?.managerId?.name ||
                user?.managerName ||
                "Not assigned"}
            </span>
          </p>
        </div>
      </div>

      {canReviewReport ? (
        <div className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Manager Review
          </p>

          <h3 className="mt-2 font-display text-2xl text-heading">
            Comment and close the report
          </h3>

          <form className="mt-5 space-y-4">
            <FormInput
              label="Manager Comment"
              as="textarea"
              rows={6}
              error={getErrorMessage(errors.managerComment)}
              {...register(
                "managerComment",
                textRules("Manager comment", {
                  min: 0,
                  max: 2000,
                  required: false,
                }),
              )}
            />

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={Save}
                disabled={isSaving}
                onClick={handleSubmit((formValues) =>
                  saveManagerReview(formValues, false),
                )}
              >
                {isSaving ? "Saving..." : "Save Comment"}
              </Button>

              {dailyWorkUpdate?.status !== "Reviewed" ? (
                <Button
                  type="button"
                  icon={CheckCircle2}
                  disabled={isSaving}
                  onClick={handleSubmit((formValues) =>
                    saveManagerReview(formValues, true),
                  )}
                >
                  {isSaving
                    ? "Reviewing..."
                    : "Mark as Reviewed"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  </div>
</div>
  );
}
