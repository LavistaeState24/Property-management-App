import { Building2, CalendarDays, MapPin, Phone, Save, Shapes, UserRound, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { propertyConditionOptions, propertySourceOptions, propertyStatusOptions, propertyTypes } from "../../../constants/theme";
import { clientService } from "../../../services/clientService";
import {
  applyServerErrors,
  dateRules,
  getErrorMessage,
  numberRules,
  phoneRules,
  selectRules,
  textRules,
  toOptionalNumber,
} from "../../../utils/validation";

const initialState = {
  ownerName: "",
  clientPhoneNumber: "",
  address: "",
  premiseName: "",
  premiseArea: "",
  sourceOfProperty: "",
  propertyType: "",
  ownerPrice: "",
  propertyCondition: "",
  propertyAge: "",
  propertySize: "",
  internalNotes: "",
  propertyStatus: "",
  dateOfAddingProperty: "",
};

const mapClientToForm = (client) => ({
  ownerName: client.ownerName || "",
  clientPhoneNumber: client.clientPhoneNumber || "",
  address: client.address || "",
  premiseName: client.premiseName || "",
  premiseArea: client.premiseArea || "",
  sourceOfProperty: client.sourceOfProperty || "",
  propertyType: client.propertyType || "",
  ownerPrice: client.ownerPrice?.toString() || "",
  propertyCondition: client.propertyCondition || "",
  propertyAge: client.propertyAge || "",
  propertySize: client.propertySize || "",
  internalNotes: client.internalNotes || "",
  propertyStatus: client.propertyStatus || "",
  dateOfAddingProperty: client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toISOString().slice(0, 10) : "",
});

const formatCompactPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)} Cr`;
  }

  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} Lac`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }

  return amount.toString();
};

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
        setLoadError(requestError.response?.data?.message || "Unable to load property details");
      } finally {
        setIsLoadingClient(false);
      }
    };

    loadClient();
  }, [id, isEditMode, reset]);

  const ownerPrice = watch("ownerPrice");

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        ownerPrice: toOptionalNumber(formValues.ownerPrice),
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
    return <p className="text-sm text-muted">Loading property details...</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-md tracking-[0.1em] text-gold">{isEditMode ? "Property Editing" : "Property Intake"}</p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update property intake profile" : "Add a new property intake profile"}
        </h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Owner Name"
          icon={UserRound}
          placeholder="Enter owner name"
          error={getErrorMessage(errors.ownerName)}
          {...register("ownerName", textRules("Owner name", { min: 3, max: 80 }))}
        />

        <FormInput
          label="Client Phone Number"
          icon={Phone}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter client phone number"
          error={getErrorMessage(errors.clientPhoneNumber)}
          {...register(
            "clientPhoneNumber",
            phoneRules({
              requiredMessage: "Client phone number is required",
              invalidMessage: "Client phone number must be a valid 10-digit Indian mobile number",
            })
          )}
        />

        <FormInput
          label="Address"
          icon={MapPin}
          placeholder="Enter full property address"
          error={getErrorMessage(errors.address)}
          {...register("address", textRules("Address", { min: 5, max: 200 }))}
        />

        <FormInput
          label="Premise Name"
          icon={Building2}
          placeholder="Enter premise name"
          error={getErrorMessage(errors.premiseName)}
          {...register("premiseName", textRules("Premise name", { min: 2, max: 100 }))}
        />

        <FormInput
          label="Premise Area"
          icon={MapPin}
          placeholder="Enter premise area"
          error={getErrorMessage(errors.premiseArea)}
          {...register("premiseArea", textRules("Premise area", { min: 2, max: 80 }))}
        />

        <SelectDropdown
          label="Source of Property"
          icon={Shapes}
          options={propertySourceOptions}
          error={getErrorMessage(errors.sourceOfProperty)}
          {...register("sourceOfProperty", selectRules("Source of property"))}
        />

        <SelectDropdown
          label="Property Type"
          icon={Shapes}
          options={propertyTypes}
          error={getErrorMessage(errors.propertyType)}
          {...register("propertyType", selectRules("Property type"))}
        />

        <SelectDropdown
          label="Property Status"
          icon={Shapes}
          options={propertyStatusOptions}
          placeholder="Select property status"
          error={getErrorMessage(errors.propertyStatus)}
          {...register("propertyStatus", selectRules("Property status", { requiredMessage: "Property status is required" }))}
        />

        <div className="space-y-2">
          <FormInput
            label="Owner Price"
            icon={Wallet}
            type="number"
            placeholder="Enter owner price"
            error={getErrorMessage(errors.ownerPrice)}
            {...register("ownerPrice", numberRules("Owner price", { required: true, min: 0 }))}
          />
          {formatCompactPrice(ownerPrice) ? (
            <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
              {formatCompactPrice(ownerPrice)}
            </div>
          ) : null}
        </div>

        <SelectDropdown
          label="Property Condition"
          icon={Shapes}
          options={propertyConditionOptions}
          error={getErrorMessage(errors.propertyCondition)}
          {...register("propertyCondition", selectRules("Property condition"))}
        />

        <FormInput
          label="Property Age"
          placeholder="e.g. 5 years"
          error={getErrorMessage(errors.propertyAge)}
          {...register("propertyAge", textRules("Property age", { min: 1, max: 80 }))}
        />

        <FormInput
          label="Size of Property"
          placeholder="e.g. 1450 sq ft"
          error={getErrorMessage(errors.propertySize)}
          {...register("propertySize", textRules("Size of property", { min: 1, max: 80 }))}
        />

        <FormInput
          label="Date of Adding Property"
          icon={CalendarDays}
          type="date"
          className="lg:col-span-2"
          error={getErrorMessage(errors.dateOfAddingProperty)}
          {...register("dateOfAddingProperty", dateRules("Date of adding property", { required: true }))}
        />

        <FormInput
          label="Internal Notes"
          as="textarea"
          rows={5}
          className="lg:col-span-2"
          placeholder="Add internal notes about this property/client"
          error={getErrorMessage(errors.internalNotes)}
          {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
        />

        {formError ? <p className="lg:col-span-2 text-sm text-rose-300">{formError}</p> : null}

        <div className="lg:col-span-2 flex justify-end gap-3 text-center">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Property" : "Save Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
