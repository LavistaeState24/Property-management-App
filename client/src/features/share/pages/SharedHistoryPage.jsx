import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Eye, MessageSquareShare, PencilLine, Save, Send } from "lucide-react";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { shareRecordStatuses } from "../../../constants/theme";
import { shareRecordService } from "../../../services/shareRecordService";
import { dateRules, getErrorMessage, textRules } from "../../../utils/validation";

const formatWhatsAppPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

export default function SharedHistoryPage() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      status: "shared",
      notes: "",
      followUpDate: "",
    },
  });

  const loadRecords = async () => {
    const data = await shareRecordService.list();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const openActionModal = (record, type) => {
    setSelectedRecord(record);
    setActionType(type);
    setActionError("");
    reset({
      status: record.status || "shared",
      notes: record.notes || "",
      followUpDate: record.followUpDate ? new Date(record.followUpDate).toISOString().slice(0, 10) : "",
    });
  };

  const closeActionModal = () => {
    setSelectedRecord(null);
    setActionType("");
    setActionError("");
  };

  const handleCopyMessage = async (message) => {
    await navigator.clipboard.writeText(message);
  };

  const handleReshare = (record) => {
    const whatsappUrl = `https://wa.me/${formatWhatsAppPhone(record.clientPhone)}?text=${encodeURIComponent(record.whatsappMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const submitAction = async (formValues) => {
    if (!selectedRecord) {
      return;
    }

    setActionError("");

    try {
      if (actionType === "status") {
        await shareRecordService.updateStatus(selectedRecord._id, {
          status: formValues.status,
          followUpDate: formValues.followUpDate || undefined,
        });
      } else if (actionType === "notes") {
        await shareRecordService.updateNotes(selectedRecord._id, {
          notes: formValues.notes,
          followUpDate: formValues.followUpDate || undefined,
        });
      }

      await loadRecords();
      closeActionModal();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to update share record");
    }
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";

  const columns = [
    { key: "clientName", label: "Client Name" },
    { key: "clientPhone", label: "Client Phone" },
    { key: "projectPublicAlias", label: "Project Alias" },
    { key: "sharedByName", label: "Shared By" },
    {
      key: "createdAt",
      label: "Shared Date",
      render: (row) => new Date(row.createdAt).toLocaleString("en-IN"),
    },
    { key: "status", label: "Status" },
    {
      key: "followUpDate",
      label: "Follow-up Date",
      render: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleDateString("en-IN") : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => openActionModal(row, "view")}
            title="View shared message"
            aria-label="View shared message"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => handleCopyMessage(row.whatsappMessage)}
            title="Copy WhatsApp message"
            aria-label="Copy WhatsApp message"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => handleReshare(row)}
            title="Re-share on WhatsApp"
            aria-label="Re-share on WhatsApp"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => openActionModal(row, "status")}
            title="Update status"
            aria-label="Update status"
          >
            <MessageSquareShare className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => openActionModal(row, "notes")}
            title="Add notes"
            aria-label="Add notes"
          >
            <PencilLine className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Shared History</p>
        <h2 className="mt-2 font-display text-3xl">Client-safe project sharing history</h2>
      </div>

      <DataTable columns={columns} rows={records} />

      <Modal
        title={
          actionType === "view"
            ? "Shared WhatsApp Message"
            : actionType === "status"
              ? "Update Share Status"
              : "Add Notes"
        }
        isOpen={Boolean(selectedRecord)}
        onClose={closeActionModal}
      >
        {selectedRecord && actionType === "view" ? (
          <div className="space-y-4 text-sm text-muted">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap text-ivory">
              {selectedRecord.whatsappMessage}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" icon={Copy} onClick={() => handleCopyMessage(selectedRecord.whatsappMessage)}>
                Copy Message
              </Button>
            </div>
          </div>
        ) : null}

        {selectedRecord && actionType !== "view" ? (
          <form className="space-y-4" onSubmit={handleSubmit(submitAction)}>
            {actionType === "status" ? (
              <SelectDropdown
                label="Status"
                options={shareRecordStatuses}
                error={getErrorMessage(errors.status)}
                {...register("status", { required: "Status is required" })}
              />
            ) : (
              <FormInput
                label="Notes"
                placeholder="Add notes about this shared record"
                error={getErrorMessage(errors.notes)}
                {...register("notes", textRules("Notes", { min: 3, max: 1000, required: false }))}
              />
            )}

            <FormInput
              label="Follow-up Date"
              type="date"
              error={getErrorMessage(errors.followUpDate)}
              {...register("followUpDate", dateRules("Follow-up date"))}
            />

            {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}

            <div className="flex justify-end">
              <Button disabled={isSubmitting} icon={Save}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
