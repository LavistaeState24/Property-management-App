import {
  Building2,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  MapPin,
  Phone,
  Ruler,
  ScrollText,
  Shapes,
  Sparkles,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import {
  interestLevelOptions,
  leadStatusOptions,
} from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { userService } from "../../../services/userService";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSalesUser = user?.role === "sales";
  const canUpdateClients = useCan("clients", "update");
  const canShowQuickUpdate = canUpdateClients || isSalesUser;
  const [client, setClient] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [quickEdit, setQuickEdit] = useState({
    assignedStaff: "",
    leadStatus: "",
    interestLevel: "",
    notes: "",
    internalNotes: "",
    lastCallStatus: "",
    nextFollowUpDate: "",
  });
  const [loadError, setLoadError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      setLoadError("");

      try {
        const [data, assignableUsers] = await Promise.all([clientService.getById(id), userService.listAssignable()]);
        setClient(data);
        setStaffOptions(
          assignableUsers.map((user) => ({
            value: user.id,
            label: `${user.name} (${user.role})`,
          })),
        );
        setQuickEdit({
          assignedStaff: data.assignedStaff?._id || data.assignedStaff || "",
          leadStatus: data.leadStatus || "New Lead",
          interestLevel: data.interestLevel || "Warm",
          notes: data.notes || "",
          internalNotes: data.internalNotes || "",
          lastCallStatus: data.lastCallStatus || "",
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate).toISOString().slice(0, 10) : "",
        });
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load lead details");
      }
    };

    loadClient();
  }, [id]);

  const handleQuickUpdate = async () => {
    setUpdateError("");
    setIsSaving(true);

    try {
      const payload = {
        leadStatus: quickEdit.leadStatus,
        interestLevel: quickEdit.interestLevel,
        notes: quickEdit.notes,
        internalNotes: quickEdit.internalNotes,
        lastCallStatus: quickEdit.lastCallStatus,
        nextFollowUpDate: quickEdit.nextFollowUpDate || null,
      };

      if (!isSalesUser) {
        payload.assignedStaff = quickEdit.assignedStaff || null;
      }

      const updatedClient = await clientService.update(id, payload);

      setClient(updatedClient);
      setQuickEdit({
        assignedStaff: updatedClient.assignedStaff?._id || updatedClient.assignedStaff || "",
        leadStatus: updatedClient.leadStatus || "New Lead",
        interestLevel: updatedClient.interestLevel || "Warm",
        notes: updatedClient.notes || "",
        internalNotes: updatedClient.internalNotes || "",
        lastCallStatus: updatedClient.lastCallStatus || "",
        nextFollowUpDate: updatedClient.nextFollowUpDate ? new Date(updatedClient.nextFollowUpDate).toISOString().slice(0, 10) : "",
      });
    } catch (requestError) {
      setUpdateError(requestError.response?.data?.message || "Unable to update lead");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  if (!client) {
    return <p className="text-sm text-muted">Loading lead details...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{client.areaPreference || client.premiseArea || "Lead Pipeline"}</p>
          <h2 className="mt-2 font-display text-4xl">{client.ownerName}</h2>
          <p className="mt-2 text-sm text-muted">{client.clientPhoneNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="slate">{client.leadStatus || "New Lead"}</Badge>
          <Badge tone={getInterestLevelTone(client.interestLevel)}>{client.interestLevel || "Warm"}</Badge>
          <Badge tone="green">{client.assignedStaff?.name || "Unassigned"}</Badge>
          {canUpdateClients && !isSalesUser ? (
            <Link to={`/clients/${client._id}/edit`}>
              <Button>Edit Lead</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Lead Snapshot</h3>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Assigned Staff", client.assignedStaff?.name, UserCheck],
                ["Lead Source", client.source, Shapes],
                ["Purpose", client.purpose, ClipboardList],
                ["Requirement Type", client.requirementType, Shapes],
                ["Area Preference", client.areaPreference, MapPin],
                ["Budget Range", formatBudgetRange(client.budgetMin, client.budgetMax), IndianRupee],
                ["Last Call Status", client.lastCallStatus, Phone],
                ["Next Follow-up", client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toLocaleDateString("en-IN") : "-", CalendarDays],
                ["Premise Name", client.premiseName, Building2],
                ["Premise Area", client.premiseArea, MapPin],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gold-2" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                  </div>
                  <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Client and Property Profile</h3>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Client Name", client.ownerName, UserRound],
                ["Phone Number", client.clientPhoneNumber, Phone],
                ["Address", client.address, MapPin],
                ["Source of Property", client.sourceOfProperty, Shapes],
                ["Property Type", client.propertyType, Sparkles],
                ["Property Status", client.propertyStatus, Shapes],
                ["Owner Price", client.ownerPrice?.toLocaleString("en-IN"), IndianRupee],
                ["Property Condition", client.propertyCondition, Shapes],
                ["Property Age", client.propertyAge, ScrollText],
                ["Size of Property", client.propertySize, Ruler],
                ["Date Added", client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toLocaleDateString("en-IN") : "Not added", CalendarDays],
                ["Created By", client.createdBy?.name, UserRound],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gold-2" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                  </div>
                  <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          { canShowQuickUpdate ? (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-gold-2" />
                <h3 className="font-display text-2xl">Quick Pipeline Update</h3>
              </div>

              <div className="mt-5 space-y-4">
                {!isSalesUser ? (
                  <SelectDropdown
                    label="Assigned Staff"
                    options={staffOptions}
                    placeholder="Auto assign to creator"
                    value={quickEdit.assignedStaff}
                    onChange={(event) => setQuickEdit((current) => ({ ...current, assignedStaff: event.target.value }))}
                  />
                ) : null}
                <SelectDropdown
                  label="Lead Status"
                  options={leadStatusOptions}
                  value={quickEdit.leadStatus}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, leadStatus: event.target.value }))}
                />
                <SelectDropdown
                  label="Interest Level"
                  options={interestLevelOptions}
                  value={quickEdit.interestLevel}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, interestLevel: event.target.value }))}
                />
                <FormInput
                  label="Last Call Status"
                  placeholder="Answered, no response, busy..."
                  value={quickEdit.lastCallStatus}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, lastCallStatus: event.target.value }))}
                />
                <FormInput
                  label="Next Follow-up Date"
                  type="date"
                  value={quickEdit.nextFollowUpDate}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, nextFollowUpDate: event.target.value }))}
                />
                <FormInput
                  label="Lead Notes"
                  as="textarea"
                  rows={4}
                  className="lg:col-span-2"
                  value={quickEdit.notes}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, notes: event.target.value }))}
                />
                <FormInput
                  label="Internal Notes"
                  as="textarea"
                  rows={4}
                  className="lg:col-span-2"
                  value={quickEdit.internalNotes}
                  onChange={(event) => setQuickEdit((current) => ({ ...current, internalNotes: event.target.value }))}
                />

                {updateError ? <p className="text-sm text-rose-300">{updateError}</p> : null}

                <div className="flex justify-end">
                  <Button type="button" onClick={handleQuickUpdate} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Update"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-gold-2" />
              <h3 className="font-display text-2xl">Notes</h3>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Lead Notes</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">{client.notes || "No lead notes added."}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Internal Notes</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
                  {client.internalNotes || "No internal notes added."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Follow-up</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
                  {client.lastCallStatus || "No call status added."}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Next follow-up: {client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toLocaleDateString("en-IN") : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
