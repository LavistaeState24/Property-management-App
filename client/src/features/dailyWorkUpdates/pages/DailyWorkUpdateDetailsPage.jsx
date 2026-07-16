import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import PageSkeleton from "../../../components/common/PageSkeleton";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { dailyWorkUpdateService } from "../../../services/dailyWorkUpdateService";
import {
  canEditDailyWorkUpdate,
  formatDailyWorkUpdateDate,
  formatDailyWorkUpdateDateTime,
  getDailyWorkUpdateReviewStatus,
  getDailyWorkUpdateReviewTone,
  getDailyWorkUpdateStatusTone,
} from "../dailyWorkUpdateConfig";

export default function DailyWorkUpdateDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canUpdateDailyWorkUpdates = useCan(
    "dailyWorkUpdates",
    "update",
  );

  const canDeleteDailyWorkUpdates = useCan(
    "dailyWorkUpdates",
    "delete",
  );

  const [dailyWorkUpdate, setDailyWorkUpdate] =
    useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadDailyWorkUpdate = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const data =
          await dailyWorkUpdateService.getById(id);

        setDailyWorkUpdate(data);
      } catch (requestError) {
        setPageError(
          requestError.response?.data?.message ||
            "Unable to load daily work update",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyWorkUpdate();
  }, [id]);

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (!dailyWorkUpdate) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-600">
          {pageError ||
            "Daily work update not found."}
        </p>

        <Link to="/daily-work-updates">
          <Button
            type="button"
            variant="secondary"
            icon={ArrowLeft}
          >
            Back to Daily Work Updates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Daily Work Updates
          </p>

          <h2 className="mt-2 font-display text-3xl text-heading">
            {dailyWorkUpdate.userId?.name ||
              "Employee Report"}
          </h2>

          <p className="mt-2 text-sm text-body">
            {formatDailyWorkUpdateDate(
              dailyWorkUpdate.reportDate,
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge
            tone={getDailyWorkUpdateStatusTone(
              dailyWorkUpdate.status,
            )}
          >
            {dailyWorkUpdate.status}
          </Badge>

          <Badge
            tone={getDailyWorkUpdateReviewTone(
              dailyWorkUpdate,
            )}
          >
            {getDailyWorkUpdateReviewStatus(
              dailyWorkUpdate,
            )}
          </Badge>

          {canEditDailyWorkUpdate(
            dailyWorkUpdate,
            user,
            canUpdateDailyWorkUpdates,
          ) ? (
            <Link
              to={`/daily-work-updates/${dailyWorkUpdate._id}/edit`}
            >
              <Button type="button" icon={Pencil}>
                Edit
              </Button>
            </Link>
          ) : null}

          {canDeleteDailyWorkUpdates ? (
            <Button
              type="button"
              variant="secondary"
              icon={Trash2}
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete
            </Button>
          ) : null}

          <Link to="/daily-work-updates">
            <Button
              type="button"
              variant="secondary"
              icon={ArrowLeft}
            >
              Back
            </Button>
          </Link>
        </div>
      </div>

      {pageError ? (
        <p className="text-sm text-rose-600">
          {pageError}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              Manual Update
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {[
              [
                "Today's Achievement",
                dailyWorkUpdate.achievements,
              ],
              [
                "Pending Work",
                dailyWorkUpdate.pendingWork,
              ],
              [
                "Tomorrow's Plan",
                dailyWorkUpdate.tomorrowPlan,
              ],
              [
                "Need Help / Blockers",
                dailyWorkUpdate.blockers,
              ],
              [
                "Additional Notes",
                dailyWorkUpdate.additionalNotes,
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
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              Report Summary
            </p>

            <div className="mt-5 space-y-4">
              {[
                [
                  "Employee",
                  dailyWorkUpdate.userId?.name || "-",
                ],
                [
                  "Date",
                  formatDailyWorkUpdateDate(
                    dailyWorkUpdate.reportDate,
                  ),
                ],
                [
                  "Status",
                  dailyWorkUpdate.status || "-",
                ],
                [
                  "Review Status",
                  getDailyWorkUpdateReviewStatus(
                    dailyWorkUpdate,
                  ),
                ],
                [
                  "Submitted Time",
                  formatDailyWorkUpdateDateTime(
                    dailyWorkUpdate.submittedAt,
                  ),
                ],
                [
                  "Reviewed Time",
                  formatDailyWorkUpdateDateTime(
                    dailyWorkUpdate.reviewedAt,
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-border bg-surface-soft p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-body">
                    {label}
                  </p>

                  <p className="mt-2 break-words text-base font-medium text-heading">
                    {value || "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-border bg-surface p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              Manager Comment
            </p>

            <p className="mt-4 whitespace-pre-wrap break-words text-sm text-heading">
              {dailyWorkUpdate.managerComment ||
                "No manager comment added yet."}
            </p>
          </div>
        </section>
      </div>

      <Modal
        title="Delete Daily Work Update"
        isOpen={
          canDeleteDailyWorkUpdates && isDeleteOpen
        }
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-body">
            Are you sure you want to delete this daily
            work update?
          </p>

          {pageError ? (
            <p className="text-sm text-rose-600">
              {pageError}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isDeleting}
              className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                setPageError("");
                setIsDeleting(true);

                try {
                  await dailyWorkUpdateService.remove(
                    dailyWorkUpdate._id,
                  );

                  navigate("/daily-work-updates");
                } catch (requestError) {
                  setPageError(
                    requestError.response?.data
                      ?.message ||
                      "Unable to delete daily work update",
                  );
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}