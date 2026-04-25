import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import { clientService } from "../../../services/clientService";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const loadClients = async () => {
      const data = await clientService.list();
      setClients(data.items);
    };

    loadClients();
  }, []);

  const columns = [
    { key: "name", label: "Client" },
    { key: "phone", label: "Phone" },
    { key: "preferredArea", label: "Preferred Area" },
    { key: "propertyType", label: "Type" },
    { key: "status", label: "Status" },
    {
      key: "budget",
      label: "Budget",
      render: (row) => `${row.budgetMin || "-"} - ${row.budgetMax || "-"}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Lead Desk</p>
          <h2 className="mt-2 font-display text-3xl">Client and pipeline management</h2>
        </div>
        <Link to="/clients/new">
          <Button>Add Client</Button>
        </Link>
      </div>

      <DataTable columns={columns} rows={clients} />
    </div>
  );
}

