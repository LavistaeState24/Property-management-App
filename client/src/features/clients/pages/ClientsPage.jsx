import { Eye, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { interestLevelOptions, leadStatusOptions } from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import { toast } from "../../../utils/toast";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";
import { parseLeadImportFile } from "../leadImportParser";

const initialFilters = {
  search: "",
  leadStatus: "",
  interestLevel: "",
  assignedStaff: "",
};

export default function ClientsPage() {
  const { user } = useAuth();
  const isSalesUser = user?.role === "sales";
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [duplicateHandling, setDuplicateHandling] = useState("skip");
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const resetImportState = () => {
    setImportRows([]);
    setImportFileName("");
    setImportError("");
    setImportSummary(null);
    setDuplicateHandling("skip");
    setIsParsingImport(false);
    setIsImporting(false);
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];

    resetImportState();

    if (!file) {
      return;
    }

    setImportFileName(file.name);
    setIsParsingImport(true);

    try {
      const rows = await parseLeadImportFile(file);

      if (!rows.length) {
        setImportError("No importable lead rows found. Check the header names and file content.");
        return;
      }

      setImportRows(rows);
    } catch {
      toast.error("Unable to read this file. Use a valid CSV, XLS, or XLSX file.");
      setImportError("Unable to read this file. Use a valid CSV, XLS, or XLSX file.");
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleImportLeads = async () => {
    setImportError("");
    setImportSummary(null);
    setIsImporting(true);

    try {
      const summary = await clientService.importLeads({ rows: importRows, duplicateHandling });
      setImportSummary(summary);
      await loadClients();
    } catch (requestError) {
      setImportError(requestError.response?.data?.message || "Unable to import leads");
    } finally {
      setIsImporting(false);
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
      render: (row) => formatBudgetRange(row.budgetMin, row.budgetMax),
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
          {canUpdateClients && !isSalesUser ? (
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
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" icon={Upload} onClick={() => setIsImportOpen(true)}>
              Import Leads
            </Button>
            <Link to="/clients/new">
              <Button icon={Plus}>Add Lead</Button>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
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

      <Modal
        title="Import Leads"
        isOpen={canCreateClients && isImportOpen}
        onClose={() => {
          if (!isImporting && !isParsingImport) {
            setIsImportOpen(false);
            resetImportState();
          }
        }}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-gold-2" />
                <div>
                  <p className="text-sm font-semibold text-ivory">{importFileName || "CSV, XLS, or XLSX file"}</p>
                  <p className="mt-1 text-xs text-muted">Headers: clientName, phone, email, budget, requirementType, areaPreference, source, assignedStaff</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ivory transition hover:border-gold/50 hover:bg-white/10">
                Choose File
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="sr-only"
                  onChange={handleImportFileChange}
                  disabled={isImporting || isParsingImport}
                />
              </label>
            </div>
          </div>

          <SelectDropdown
            label="Duplicate Phone Handling"
            options={[
              { value: "skip", label: "Skip duplicates" },
              { value: "mark", label: "Mark duplicates in summary" },
            ]}
            value={duplicateHandling}
            onChange={(event) => setDuplicateHandling(event.target.value)}
          />

          {isParsingImport ? <p className="text-sm text-muted">Reading import file...</p> : null}
          {importError ? <p className="text-sm text-rose-300">{importError}</p> : null}

          {importRows.length ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <Badge tone="slate">{importRows.length} rows ready</Badge>
                <span>Status will default to New Lead.</span>
              </div>
              <div className="max-h-64 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                    <tr>
                      {["Row", "Client", "Phone", "Email", "Budget", "Requirement", "Area", "Assigned"].map((heading) => (
                        <th key={heading} className="px-3 py-2 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 8).map((row) => (
                      <tr key={`${row.rowNumber}-${row.phone}`} className="border-t border-white/10">
                        <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-ivory">{row.clientName || "-"}</td>
                        <td className="px-3 py-2 text-ivory">{row.phone || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.email || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.budget || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.requirementType || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.areaPreference || "-"}</td>
                        <td className="px-3 py-2 text-muted">{row.assignedStaff || "Auto"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importRows.length > 8 ? <p className="text-xs text-muted">Showing first 8 rows only.</p> : null}
            </div>
          ) : null}

          {importSummary ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Badge tone="green">Imported {importSummary.imported}</Badge>
                <Badge tone="slate">Skipped {importSummary.skipped}</Badge>
                <Badge tone="gold">Duplicates {importSummary.duplicates}</Badge>
                <Badge tone="rose">Invalid {importSummary.invalid}</Badge>
              </div>
              {[...(importSummary.duplicateRows || []), ...(importSummary.invalidRows || [])].length ? (
                <div className="max-h-44 overflow-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-white/5 uppercase tracking-[0.16em] text-muted">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(importSummary.duplicateRows || []), ...(importSummary.invalidRows || [])].slice(0, 20).map((row) => (
                        <tr key={`${row.rowNumber}-${row.phone}-${row.reason || row.errors?.[0]}`} className="border-t border-white/10">
                          <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                          <td className="px-3 py-2 text-ivory">{row.phone || "-"}</td>
                          <td className="px-3 py-2 text-muted">{row.reason || row.errors?.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isImporting || isParsingImport}
              onClick={() => {
                setIsImportOpen(false);
                resetImportState();
              }}
            >
              Cancel
            </Button>
            <Button type="button" icon={Upload} disabled={!importRows.length || isImporting || isParsingImport} onClick={handleImportLeads}>
              {isImporting ? "Importing..." : "Import Leads"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
