import { useEffect, useState } from "react";

import Badge from "../../../components/common/Badge";
import DataTable from "../../../components/common/DataTable";
import { followupService } from "../../../services/followupService";

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);

  useEffect(() => {
    const loadFollowups = async () => {
      const data = await followupService.list();
      setFollowups(data);
    };

    loadFollowups();
  }, []);

  const columns = [
    { key: "note", label: "Note" },
    { key: "type", label: "Type" },
    {
      key: "client",
      label: "Client",
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
      <DataTable columns={columns} rows={followups} />
    </div>
  );
}

