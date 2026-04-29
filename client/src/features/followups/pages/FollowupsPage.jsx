import { useEffect, useState } from "react";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import { followupService } from "../../../services/followupService";

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFollowups = async () => {
      setIsLoading(true);

      try {
        const data = await followupService.list();
        setFollowups(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowups();
  }, []);

  const columns = [
    { key: "note", label: "Note" },
    { key: "type", label: "Type" },
    {
      key: "client",
      label: "Client",
      searchValue: (row) => row.client?.name || "",
      render: (row) => row.client?.name || "-",
    },
    {
      key: "dueDate",
      label: "Due",
      render: (row) => new Date(row.dueDate).toLocaleDateString("en-IN"),
    },
    {
      key: "completed",
      label: "Status",
      render: (row) => <Badge tone={row.completed ? "green" : "gold"}>{row.completed ? "Done" : "Pending"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Execution Tracker</p>
        <h2 className="mt-2 font-display text-3xl">Follow-up command center</h2>
      </div>
      <AdvancedDataTable
        columns={columns}
        rows={followups}
        loading={isLoading}
        loadingMessage="Loading follow-ups..."
        emptyMessage="No follow-ups found."
        searchPlaceholder="Search follow-ups..."
        defaultRowsPerPage={10}
      />
    </div>
  );
}
