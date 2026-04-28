import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import { clientService } from "../../../services/clientService";

export default function ClientsPage() {
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
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/clients/${row._id}`}>
            <Button variant="ghost" className="px-3 py-2 text-gold-2" icon={Eye}>
              View
            </Button>
          </Link>
          <Link to={`/clients/${row._id}/edit`}>
            <Button variant="ghost" className="px-3 py-2 text-gold-2" icon={Pencil}>
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="px-3 py-2 text-rose-300 hover:text-rose-200"
            icon={Trash2}
            onClick={() => {
              setDeleteError("");
              setClientToDelete(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
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
          <Button icon={Plus}>Add Client</Button>
        </Link>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      {isLoading ? (
        <p className="text-sm text-muted">Loading clients...</p>
      ) : (
        <DataTable columns={columns} rows={clients} />
      )}

      <Modal
        title="Delete Client"
        isOpen={Boolean(clientToDelete)}
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
