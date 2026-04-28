import { CalendarDays, Mail, MapPin, Phone, Save, Shapes, UserRound, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { clientStatuses, propertyTypes } from "../../../constants/theme";
import { clientService } from "../../../services/clientService";
import {
  applyServerErrors,
  dateRules,
  emailRules,
  getErrorMessage,
  numberRules,
  phoneRules,
  selectRules,
  textRules,
  toOptionalNumber,
} from "../../../utils/validation";

const initialState = {
  name: "",
  phone: "",
  email: "",
  requirement: "",
  budgetMin: "",
  budgetMax: "",
  preferredArea: "",
  propertyType: "",
  followUpDate: "",
  status: "new",
  notes: "",
};

const mapClientToForm = (client) => ({
  name: client.name || "",
  phone: client.phone || "",
  email: client.email || "",
  requirement: client.requirement || "",
  budgetMin: client.budgetMin?.toString() || "",
  budgetMax: client.budgetMax?.toString() || "",
  preferredArea: client.preferredArea || "",
  propertyType: client.propertyType || "",
  followUpDate: client.followUpDate ? new Date(client.followUpDate).toISOString().slice(0, 10) : "",
  status: client.status || "new",
  notes: client.notes || "",
});

export default function AddClientPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoadingClient, setIsLoadingClient] = useState(isEditMode);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialState,
  });

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadClient = async () => {
      setIsLoadingClient(true);
      setLoadError("");

      try {
        const client = await clientService.getById(id);
        reset(mapClientToForm(client));
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load client details");
      } finally {
        setIsLoadingClient(false);
      }
    };

    loadClient();
  }, [id, isEditMode, reset]);

  const budgetMin = watch("budgetMin");

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        budgetMin: toOptionalNumber(formValues.budgetMin) ?? 0,
        budgetMax: toOptionalNumber(formValues.budgetMax) ?? 0,
      };

      if (isEditMode) {
        await clientService.update(id, payload);
        navigate(`/clients/${id}`);
        return;
      }

      await clientService.create(payload);
      navigate("/clients");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  if (isLoadingClient) {
    return <p className="text-sm text-muted">Loading client details...</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {isEditMode ? "Lead Editing" : "Lead Intake"}
        </p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update qualified client profile" : "Add a qualified client profile"}
        </h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Client Name"
          icon={UserRound}
          placeholder="Enter client name"
          error={getErrorMessage(errors.name)}
          {...register("name", textRules("Client name", { min: 3, max: 60 }))}
        />

        <FormInput
          label="Phone"
          type="tel"
          icon={Phone}
          placeholder="Enter phone number"
          error={getErrorMessage(errors.phone)}
          {...register("phone", phoneRules())}
        />

        <FormInput
          label="Email"
          icon={Mail}
          type="email"
          placeholder="Enter email address"
          error={getErrorMessage(errors.email)}
          {...register("email", emailRules({ required: false }))}
        />

        <FormInput
          label="Requirement"
          placeholder="e.g. 3 BHK in 1 Cr budget"
          error={getErrorMessage(errors.requirement)}
          {...register("requirement", textRules("Requirement", { min: 5, max: 160, required: true }))}
        />

        <FormInput
          label="Budget Min"
          icon={Wallet}
          placeholder="Minimum budget"
          error={getErrorMessage(errors.budgetMin)}
          {...register("budgetMin", numberRules("Minimum budget", { required: false, min: 0 }))}
        />

        <FormInput
          label="Budget Max"
          icon={Wallet}
          placeholder="Maximum budget"
          error={getErrorMessage(errors.budgetMax)}
          {...register("budgetMax", {
            ...numberRules("Maximum budget", { required: false, min: 0 }),
            validate: (value) => {
              const baseValidation = numberRules("Maximum budget", { required: false, min: 0 }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              if (value === "" || budgetMin === "") {
                return true;
              }

              return Number(value) >= Number(budgetMin) || "Maximum budget must be greater than or equal to minimum budget";
            },
          })}
        />

        <FormInput
          label="Preferred Area"
          icon={MapPin}
          placeholder="e.g. Gota, Chandkheda, Science City"
          error={getErrorMessage(errors.preferredArea)}
          {...register("preferredArea", textRules("Preferred area", { min: 2, max: 80, required: true }))}
        />

        <SelectDropdown
          label="Property Type"
          icon={Shapes}
          options={propertyTypes}
          error={getErrorMessage(errors.propertyType)}
          {...register("propertyType", selectRules("Property type"))}
        />

        <FormInput
          label="Follow-up Date"
          icon={CalendarDays}
          type="date"
          error={getErrorMessage(errors.followUpDate)}
          {...register("followUpDate", dateRules("Follow-up date"))}
        />

        <SelectDropdown
          label="Status"
          options={clientStatuses}
          error={getErrorMessage(errors.status)}
          {...register("status", selectRules("Status"))}
        />

        <FormInput
          label="Notes"
          className="lg:col-span-2"
          placeholder="Add client notes, preferences, follow-up details"
          error={getErrorMessage(errors.notes)}
          {...register("notes", textRules("Notes", { min: 0, max: 500, required: false }))}
        />

        {formError ? <p className="lg:col-span-2 text-sm text-rose-300">{formError}</p> : null}

        <div className="lg:col-span-2 flex gap-3">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Client" : "Save Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
