import {
  Building2,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  IndianRupee,
  Mail,
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
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import {
  interestLevelOptions,
  leadStatusOptions,
} from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { useCan } from "../../../hooks/useCan";
import { clientService } from "../../../services/clientService";
import { followupService } from "../../../services/followupService";
import { userService } from "../../../services/userService";
import { formatBudgetRange, getInterestLevelTone } from "../clientPipeline";

const reminderTypes = ["Call", "WhatsApp", "Details Send", "Site Visit", "Payment", "Document"];

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSalesUser = user?.role === "sales";
  const canUpdateClients = useCan("clients", "update");
  const canViewFollowups = useCan("followups", "view");
  const canCreateFollowups = useCan("followups", "create");
  const canUpdateFollowups = useCan("followups", "update");
  const canShowQuickUpdate = canUpdateClients || isSalesUser;
  const initialCallForm = {
    callConnected: false,
    leadStatus: "New Lead",
    interestLevel: "Warm",
    discussionSummary: "",
    requirementNote: "",
    objection: "",
    nextAction: "",
    nextFollowupDateTime: "",
    reminderType: "Call",
    callDuration: "",
    lostReason: "",
  };
  const initialReminderForm = {
    assignedStaff: "",
    reminderType: "Call",
    reminderDateTime: "",
    note: "",
  };
  const [client, setClient] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [callForm, setCallForm] = useState(initialCallForm);
  const [callErrors, setCallErrors] = useState({});
  const [callError, setCallError] = useState("");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [reminderForm, setReminderForm] = useState(initialReminderForm);
  const [reminderErrors, setReminderErrors] = useState({});
  const [reminderError, setReminderError] = useState("");
  const [completionReminder, setCompletionReminder] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [isSavingReminder, setIsSavingReminder] = useState(false);
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
        const [data, assignableUsers, callHistory, reminderData] = await Promise.all([
          clientService.getById(id),
          userService.listAssignable(),
          clientService.listCallLogs(id),
          canViewFollowups ? followupService.list({ leadId: id, limit: 100 }) : Promise.resolve({ items: [] }),
        ]);
        setClient(data);
        setCallLogs(callHistory);
        setReminders(reminderData.items || []);
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
        setCallForm((current) => ({
          ...current,
          leadStatus: data.leadStatus || "New Lead",
          interestLevel: data.interestLevel || "Warm",
        }));
        setReminderForm((current) => ({
          ...current,
          assignedStaff: data.assignedStaff?._id || data.assignedStaff || "",
        }));
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load lead details");
      }
    };

    loadClient();
  }, [canViewFollowups, id]);

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

  const updateCallForm = (field, value) => {
    setCallForm((current) => ({ ...current, [field]: value }));
    setCallErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleCallUpdate = async () => {
    setCallError("");
    setCallErrors({});
    setIsSavingCall(true);

    try {
      const payload = {
        ...callForm,
        callDuration: callForm.callDuration ? Number(callForm.callDuration) : undefined,
        nextFollowupDateTime: callForm.nextFollowupDateTime || null,
      };
      const savedCallLog = await clientService.createCallLog(id, payload);
      const [updatedClient, reminderData] = await Promise.all([
        clientService.getById(id),
        canViewFollowups ? followupService.list({ leadId: id, limit: 100 }) : Promise.resolve({ items: [] }),
      ]);

      setClient(updatedClient);
      setCallLogs((current) => [savedCallLog, ...current]);
      setReminders(reminderData.items || []);
      setQuickEdit((current) => ({
        ...current,
        leadStatus: updatedClient.leadStatus || "New Lead",
        interestLevel: updatedClient.interestLevel || "Warm",
        notes: updatedClient.notes || "",
        lastCallStatus: updatedClient.lastCallStatus || "",
        nextFollowUpDate: updatedClient.nextFollowUpDate ? new Date(updatedClient.nextFollowUpDate).toISOString().slice(0, 10) : "",
      }));
      setCallForm({
        ...initialCallForm,
        leadStatus: updatedClient.leadStatus || "New Lead",
        interestLevel: updatedClient.interestLevel || "Warm",
      });
    } catch (requestError) {
      setCallErrors(requestError.response?.data?.errors || {});
      setCallError(requestError.response?.data?.message || "Unable to save call update");
    } finally {
      setIsSavingCall(false);
    }
  };

  const updateReminderForm = (field, value) => {
    setReminderForm((current) => ({ ...current, [field]: value }));
    setReminderErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleCreateReminder = async () => {
    setReminderError("");
    setReminderErrors({});
    setIsSavingReminder(true);

    try {
      await followupService.create({
        client: id,
        ...reminderForm,
      });
      const reminderData = canViewFollowups ? await followupService.list({ leadId: id, limit: 100 }) : { items: [] };
      setReminders(reminderData.items || []);
      setReminderForm({
        ...initialReminderForm,
        assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
      });
    } catch (requestError) {
      setReminderErrors(requestError.response?.data?.errors || {});
      setReminderError(requestError.response?.data?.message || "Unable to create reminder");
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleCompleteReminder = async () => {
    if (!completionReminder) return;

    setReminderError("");
    setIsSavingReminder(true);

    try {
      await followupService.complete(completionReminder._id, { completionNote });
      const reminderData = canViewFollowups ? await followupService.list({ leadId: id, limit: 100 }) : { items: [] };
      setReminders(reminderData.items || []);
      setCompletionReminder(null);
      setCompletionNote("");
    } catch (requestError) {
      setReminderError(requestError.response?.data?.errors?.completionNote || requestError.response?.data?.message || "Unable to complete reminder");
    } finally {
      setIsSavingReminder(false);
    }
  };

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");
  const getReminderStatusTone = (status) => {
    if (status === "Completed") return "green";
    if (status === "Overdue") return "rose";
    if (status === "Cancelled") return "slate";
    return "gold";
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
                ["Email", client.email, Mail],
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

          {canShowQuickUpdate ? (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gold-2" />
                <h3 className="font-display text-2xl">Call Update</h3>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-ivory">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold"
                    checked={callForm.callConnected}
                    onChange={(event) => updateCallForm("callConnected", event.target.checked)}
                  />
                  Call connected
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectDropdown
                    label="Lead Status"
                    options={leadStatusOptions}
                    value={callForm.leadStatus}
                    onChange={(event) => updateCallForm("leadStatus", event.target.value)}
                    error={callErrors.leadStatus}
                  />
                  <SelectDropdown
                    label="Interest Level"
                    options={interestLevelOptions}
                    value={callForm.interestLevel}
                    onChange={(event) => updateCallForm("interestLevel", event.target.value)}
                    error={callErrors.interestLevel}
                  />
                </div>

                <FormInput
                  label="Discussion Summary"
                  as="textarea"
                  rows={4}
                  value={callForm.discussionSummary}
                  onChange={(event) => updateCallForm("discussionSummary", event.target.value)}
                  error={callErrors.discussionSummary}
                />
                <FormInput
                  label="Requirement Note"
                  as="textarea"
                  rows={3}
                  value={callForm.requirementNote}
                  onChange={(event) => updateCallForm("requirementNote", event.target.value)}
                  error={callErrors.requirementNote}
                />
                <FormInput
                  label="Objection"
                  as="textarea"
                  rows={3}
                  value={callForm.objection}
                  onChange={(event) => updateCallForm("objection", event.target.value)}
                  error={callErrors.objection}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Next Action"
                    value={callForm.nextAction}
                    onChange={(event) => updateCallForm("nextAction", event.target.value)}
                    error={callErrors.nextAction}
                  />
                  <FormInput
                    label="Next Follow-up"
                    type="datetime-local"
                    value={callForm.nextFollowupDateTime}
                    onChange={(event) => updateCallForm("nextFollowupDateTime", event.target.value)}
                    error={callErrors.nextFollowupDateTime}
                  />
                  <SelectDropdown
                    label="Reminder Type"
                    options={["None", ...reminderTypes]}
                    value={callForm.reminderType}
                    onChange={(event) => updateCallForm("reminderType", event.target.value)}
                    error={callErrors.reminderType}
                  />
                  <FormInput
                    label="Call Duration (minutes)"
                    type="number"
                    min="0"
                    value={callForm.callDuration}
                    onChange={(event) => updateCallForm("callDuration", event.target.value)}
                    error={callErrors.callDuration}
                  />
                </div>

                {callForm.leadStatus === "Lost" ? (
                  <FormInput
                    label="Lost Reason"
                    as="textarea"
                    rows={3}
                    value={callForm.lostReason}
                    onChange={(event) => updateCallForm("lostReason", event.target.value)}
                    error={callErrors.lostReason}
                  />
                ) : null}

                {callError ? <p className="text-sm text-rose-300">{callError}</p> : null}

                <div className="flex justify-end">
                  <Button type="button" icon={Clock} onClick={handleCallUpdate} disabled={isSavingCall}>
                    {isSavingCall ? "Saving..." : "Save Call Update"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-gold-2" />
                  <h3 className="font-display text-2xl">Call History</h3>
                </div>

                <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                      <tr>
                        {["Date", "Status", "Connected", "Summary", "Next Follow-up", "By"].map((heading) => (
                          <th key={heading} className="px-3 py-2 font-semibold">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {callLogs.length ? (
                        callLogs.map((callLog) => (
                          <tr key={callLog._id} className="border-t border-white/10 align-top">
                            <td className="px-3 py-3 text-muted">{formatDateTime(callLog.createdAt)}</td>
                            <td className="px-3 py-3 text-ivory">{callLog.leadStatus}</td>
                            <td className="px-3 py-3 text-muted">{callLog.callConnected ? "Yes" : "No"}</td>
                            <td className="max-w-xs px-3 py-3 text-muted">{callLog.discussionSummary}</td>
                            <td className="px-3 py-3 text-muted">{formatDateTime(callLog.nextFollowupDateTime)}</td>
                            <td className="px-3 py-3 text-muted">{callLog.createdBy?.name || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-6 text-center text-muted" colSpan={6}>
                            No call updates saved yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {canViewFollowups ? (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gold-2" />
                <h3 className="font-display text-2xl">Reminders</h3>
              </div>

              {canCreateFollowups ? (
              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectDropdown
                    label="Assigned Staff"
                    options={staffOptions}
                    value={reminderForm.assignedStaff}
                    onChange={(event) => updateReminderForm("assignedStaff", event.target.value)}
                    error={reminderErrors.assignedStaff}
                  />
                  <SelectDropdown
                    label="Reminder Type"
                    options={reminderTypes}
                    value={reminderForm.reminderType}
                    onChange={(event) => updateReminderForm("reminderType", event.target.value)}
                    error={reminderErrors.reminderType}
                  />
                  <FormInput
                    label="Reminder Date/Time"
                    type="datetime-local"
                    value={reminderForm.reminderDateTime}
                    onChange={(event) => updateReminderForm("reminderDateTime", event.target.value)}
                    error={reminderErrors.reminderDateTime}
                  />
                  <FormInput
                    label="Reminder Note"
                    value={reminderForm.note}
                    onChange={(event) => updateReminderForm("note", event.target.value)}
                    error={reminderErrors.note}
                  />
                </div>

                {reminderError ? <p className="text-sm text-rose-300">{reminderError}</p> : null}

                <div className="flex justify-end">
                  <Button type="button" icon={Bell} disabled={isSavingReminder} onClick={handleCreateReminder}>
                    {isSavingReminder ? "Saving..." : "Create Reminder"}
                  </Button>
                </div>
              </div>
              ) : null}

              <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted">
                    <tr>
                      {["Reminder", "Type", "Assigned", "Note", "Status", "Action"].map((heading) => (
                        <th key={heading} className="px-3 py-2 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.length ? (
                      reminders.map((reminder) => (
                        <tr key={reminder._id} className="border-t border-white/10 align-top">
                          <td className={`px-3 py-3 ${reminder.status === "Overdue" ? "font-semibold text-rose-300" : "text-muted"}`}>
                            {formatDateTime(reminder.reminderDateTime)}
                          </td>
                          <td className="px-3 py-3 text-ivory">{reminder.reminderType}</td>
                          <td className="px-3 py-3 text-muted">{reminder.assignedStaff?.name || "-"}</td>
                          <td className="max-w-xs px-3 py-3 text-muted">{reminder.note}</td>
                          <td className="px-3 py-3">
                            <Badge tone={getReminderStatusTone(reminder.status)}>{reminder.status}</Badge>
                          </td>
                          <td className="px-3 py-3">
                            {canUpdateFollowups && !["Completed", "Cancelled"].includes(reminder.status) ? (
                              <Button
                                type="button"
                                variant="secondary"
                                icon={CheckCircle2}
                                disabled={isSavingReminder}
                                onClick={() => {
                                  setReminderError("");
                                  setCompletionNote("");
                                  setCompletionReminder(reminder);
                                }}
                              >
                                Complete
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted" colSpan={6}>
                          No reminders saved yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
      <Modal
        title="Complete Reminder"
        isOpen={Boolean(completionReminder)}
        onClose={() => {
          if (!isSavingReminder) {
            setCompletionReminder(null);
          }
        }}
      >
        <div className="space-y-4">
          <FormInput
            label="Completion Note"
            as="textarea"
            rows={4}
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            error={reminderError}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={isSavingReminder} onClick={() => setCompletionReminder(null)}>
              Cancel
            </Button>
            <Button type="button" icon={CheckCircle2} disabled={isSavingReminder} onClick={handleCompleteReminder}>
              {isSavingReminder ? "Saving..." : "Complete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
