import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";

export default function ClientsPage() {
  const canCreateClients = useCan("clients", "create");
  const canUpdateClients = useCan("clients", "update");
  const canDeleteClients = useCan("clients", "delete");
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await clientService.list();
      setClients(data.items);
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDeleteClient = async () => {
    if (!clientToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await clientService.remove(clientToDelete._id);
      setClients((currentClients) => currentClients.filter((client) => client._id !== clientToDelete._id));
      setClientToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || "Unable to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

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
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link to={`/clients/${row._id}`}>
            <button type="button" className={actionButtonClassName} title="View client" aria-label="View client">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Link>
          {canUpdateClients ? (
            <Link to={`/clients/${row._id}/edit`}>
              <button type="button" className={actionButtonClassName} title="Edit client" aria-label="Edit client">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : null}
          {canDeleteClients ? (
            <button
              type="button"
              className={deleteActionButtonClassName}
              onClick={() => {
                setDeleteError("");
                setClientToDelete(row);
              }}
              title="Delete client"
              aria-label="Delete client"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Lead Desk</p>
          <h2 className="mt-2 font-display text-3xl">Client and pipeline management</h2>
        </div>
        {canCreateClients ? (
          <Link to="/clients/new">
            <Button icon={Plus}>Add Client</Button>
          </Link>
        ) : null}
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      <AdvancedDataTable
        columns={columns}
        rows={clients}
        loading={isLoading}
        loadingMessage="Loading clients..."
        emptyMessage="No clients found."
        searchPlaceholder="Search clients..."
        defaultRowsPerPage={10}
      />

      <Modal
        title="Delete Client"
        isOpen={canDeleteClients && Boolean(clientToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setClientToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this client?</p>
          {deleteError ? <p className="text-sm text-rose-300">{deleteError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setClientToDelete(null);
                setDeleteError("");
              }}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button type="button" onClick={handleDeleteClient} disabled={isDeleting} className="bg-rose-500 text-white hover:opacity-90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
