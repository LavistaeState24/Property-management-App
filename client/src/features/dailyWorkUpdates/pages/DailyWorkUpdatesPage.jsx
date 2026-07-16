import {
  Eye,
  FilePlus2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
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

export default function DailyWorkUpdatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canCreateDailyWorkUpdates = useCan(
    "dailyWorkUpdates",
    "create",
  );

  const canUpdateDailyWorkUpdates = useCan(
    "dailyWorkUpdates",
    "update",
  );

  const [dailyWorkUpdates, setDailyWorkUpdates] =
    useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadDailyWorkUpdates = async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const data =
        await dailyWorkUpdateService.listAll();

      setDailyWorkUpdates(data.items || []);
    } catch (requestError) {
      setPageError(
        requestError.response?.data?.message ||
          "Unable to load daily work updates",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDailyWorkUpdates();
  }, []);

  const actionButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-body transition hover:border-gold/50 hover:bg-gold-soft hover:text-gold";

  const columns = [
    {
      key: "reportDate",
      label: "Date",
      searchValue: (row) =>
        formatDailyWorkUpdateDate(row.reportDate),
      render: (row) =>
        formatDailyWorkUpdateDate(row.reportDate),
    },
    {
      key: "employee",
      label: "Employee",
      searchValue: (row) =>
        `${row.userId?.name || ""} ${
          row.userId?.email || ""
        }`,
      render: (row) => (
        <div>
          <p className="font-medium text-heading">
            {row.userId?.name || "-"}
          </p>

          <p className="text-xs text-body">
            {row.userId?.role || ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      searchValue: (row) => row.status || "",
      render: (row) => (
        <Badge
          tone={getDailyWorkUpdateStatusTone(
            row.status,
          )}
        >
          {row.status || "Draft"}
        </Badge>
      ),
    },
    {
      key: "submittedAt",
      label: "Submitted Time",
      searchValue: (row) =>
        formatDailyWorkUpdateDateTime(
          row.submittedAt,
        ),
      render: (row) =>
        formatDailyWorkUpdateDateTime(
          row.submittedAt,
        ),
    },
    {
      key: "reviewStatus",
      label: "Review Status",
      searchValue: (row) =>
        getDailyWorkUpdateReviewStatus(row),
      render: (row) => (
        <Badge
          tone={getDailyWorkUpdateReviewTone(row)}
        >
          {getDailyWorkUpdateReviewStatus(row)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      searchable: false,
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            className={actionButtonClasses}
            onClick={() =>
              navigate(
                `/daily-work-updates/${row._id}`,
              )
            }
            title="View report"
            aria-label="View report"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {canEditDailyWorkUpdate(
            row,
            user,
            canUpdateDailyWorkUpdates,
          ) ? (
            <button
              type="button"
              className={actionButtonClasses}
              onClick={() =>
                navigate(
                  `/daily-work-updates/${row._id}/edit`,
                )
              }
              title="Edit report"
              aria-label="Edit report"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Team Reporting
          </p>

          <h2 className="mt-2 font-display text-3xl text-heading">
            Daily work updates and review tracking
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={RefreshCw}
            onClick={loadDailyWorkUpdates}
            disabled={isLoading}
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </Button>

          {canCreateDailyWorkUpdates ? (
            <Button
              type="button"
              icon={FilePlus2}
              onClick={() =>
                navigate("/daily-work-updates/new")
              }
            >
              Add Update
            </Button>
          ) : null}
        </div>
      </div>

      {pageError ? (
        <p className="text-sm text-rose-600">
          {pageError}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={dailyWorkUpdates}
        totalRecords={dailyWorkUpdates.length}
        loading={isLoading}
        emptyMessage="No daily work updates found."
        searchPlaceholder="Search daily work updates..."
        defaultRowsPerPage={10}
      />
    </div>
  );
}