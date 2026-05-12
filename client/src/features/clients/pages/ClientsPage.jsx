import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { interestLevelOptions, leadStatusOptions } from "../../../constants/theme";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import { getInterestLevelTone } from "../clientPipeline";

const initialFilters = {
  search: "",
  leadStatus: "",
  interestLevel: "",
  assignedStaff: "",
};

export default function ClientsPage() {
  const canCreateClients = useCan("clients", "create");
  const canUpdateClients = useCan("clients", "update");
  const canDeleteClients = useCan("clients", "delete");
  const [clients, setClients] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const loadClients = async () => {
    setIsLoading(true);
    setListError("");

    try {
      const [clientData, assignableUsers] = await Promise.all([clientService.listAll(), userService.listAssignable()]);
      setClients(clientData.items);
      setStaffOptions(
        assignableUsers.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.role})`,
        })),
      );
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load leads");
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
      setDeleteError(requestError.response?.data?.message || "Unable to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        [client.ownerName, client.clientPhoneNumber, client.premiseName, client.premiseArea, client.areaPreference]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStatus = !filters.leadStatus || client.leadStatus === filters.leadStatus;
      const matchesInterest = !filters.interestLevel || client.interestLevel === filters.interestLevel;
      const matchesStaff = !filters.assignedStaff || client.assignedStaff?._id === filters.assignedStaff;

      return matchesSearch && matchesStatus && matchesInterest && matchesStaff;
    });
  }, [clients, filters]);

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

  const columns = [
    { key: "ownerName", label: "Lead" },
    {
      key: "assignedStaff",
      label: "Assigned",
      searchValue: (row) => row.assignedStaff?.name || "",
      render: (row) => row.assignedStaff?.name || "Unassigned",
    },
    {
      key: "leadStatus",
      label: "Status",
      render: (row) => <Badge tone="slate">{row.leadStatus || "New Lead"}</Badge>,
    },
    {
      key: "interestLevel",
      label: "Interest",
      render: (row) => <Badge tone={getInterestLevelTone(row.interestLevel)}>{row.interestLevel || "Warm"}</Badge>,
    },
    { key: "purpose", label: "Purpose", render: (row) => row.purpose || "Not added" },
    { key: "areaPreference", label: "Area ", render: (row) => row.areaPreference || row.premiseArea || "Not added" },
    {
      key: "budget",
      label: "Budget",
      searchValue: (row) => `${row.budgetMin || ""} ${row.budgetMax || ""}`,
      render: (row) => {
        if (row.budgetMin && row.budgetMax) {
          return `${row.budgetMin.toLocaleString("en-IN")} - ${row.budgetMax.toLocaleString("en-IN")}`;
        }

        if (row.budgetMin || row.budgetMax) {
          return (row.budgetMin || row.budgetMax).toLocaleString("en-IN");
        }

        return "Not added";
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link to={`/clients/${row._id}`}>
            <button type="button" className={actionButtonClassName} title="View lead" aria-label="View lead">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Link>
          {canUpdateClients ? (
            <Link to={`/clients/${row._id}/edit`}>
              <button type="button" className={actionButtonClassName} title="Edit lead" aria-label="Edit lead">
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
              title="Delete lead"
              aria-label="Delete lead"
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
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Lead Pipeline</p>
          <h2 className="mt-2 font-display text-3xl">Lead tracking, ownership, and conversion flow</h2>
        </div>
        {canCreateClients ? (
          <Link to="/clients/new">
            <Button icon={Plus}>Add Lead</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-5">
        <FormInput
          label="Search"
          placeholder="Name, phone, area..."
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <SelectDropdown
          label="Lead Status"
          options={leadStatusOptions}
          value={filters.leadStatus}
          onChange={(event) => setFilters((current) => ({ ...current, leadStatus: event.target.value }))}
        />
        <SelectDropdown
          label="Interest Level"
          options={interestLevelOptions}
          value={filters.interestLevel}
          onChange={(event) => setFilters((current) => ({ ...current, interestLevel: event.target.value }))}
        />
        <SelectDropdown
          label="Assigned Staff"
          options={staffOptions}
          value={filters.assignedStaff}
          onChange={(event) => setFilters((current) => ({ ...current, assignedStaff: event.target.value }))}
        />
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="w-full" onClick={() => setFilters(initialFilters)}>
            Reset Filters
          </Button>
        </div>
      </div>

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      <AdvancedDataTable
        columns={columns}
        rows={filteredClients}
        totalRecords={filteredClients.length}
        loading={isLoading}
        loadingMessage="Loading leads..."
        emptyMessage="No leads found."
        searchPlaceholder="Search visible leads..."
        defaultRowsPerPage={10}
      />

      <Modal
        title="Delete Lead"
        isOpen={canDeleteClients && Boolean(clientToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setClientToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this lead record?</p>
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
