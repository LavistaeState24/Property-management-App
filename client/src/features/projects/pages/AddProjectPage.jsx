import { Building2, CalendarDays, MapPin, Save, Shapes, Wallet } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import UploadBox from "../../../components/common/UploadBox";
import { projectStatuses, propertyTypes } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";
import {
  applyServerErrors,
  dateRules,
  getErrorMessage,
  numberRules,
  selectRules,
  textRules,
  toOptionalNumber,
} from "../../../utils/validation";

const initialState = {
  projectName: "",
  publicAlias: "",
  location: "",
  area: "",
  propertyType: "",
  configuration: "",
  sizeRange: { min: "", max: "", unit: "sqft" },
  priceRange: { min: "", max: "", currencyLabel: "INR" },
  totalPlotSize: "",
  totalBlocks: "",
  totalUnits: "",
  availableUnits: "",
  possessionDate: "",
  amenities: "",
  sampleHouseVideoUrl: "",
  internalNotes: "",
  builderDetails: "",
  status: "active",
};

export default function AddProjectPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialState,
  });

  const sizeMin = watch("sizeRange.min");
  const priceMin = watch("priceRange.min");
  const totalUnits = watch("totalUnits");

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        totalBlocks: toOptionalNumber(formValues.totalBlocks) ?? 0,
        totalUnits: toOptionalNumber(formValues.totalUnits) ?? 0,
        availableUnits: toOptionalNumber(formValues.availableUnits) ?? 0,
        sizeRange: {
          ...formValues.sizeRange,
          min: toOptionalNumber(formValues.sizeRange.min) ?? 0,
          max: toOptionalNumber(formValues.sizeRange.max) ?? 0,
        },
        priceRange: {
          ...formValues.priceRange,
          min: toOptionalNumber(formValues.priceRange.min) ?? 0,
          max: toOptionalNumber(formValues.priceRange.max) ?? 0,
        },
        amenities: formValues.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await projectService.create(payload);
      navigate("/projects");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Inventory Onboarding</p>
        <h2 className="mt-2 font-display text-3xl">Add a premium project Details</h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Project Name"
          icon={Building2}
          placeholder="Enter project name"
          error={getErrorMessage(errors.projectName)}
          {...register("projectName", textRules("Project name", { min: 3, max: 100 }))}
        />

        <FormInput
          label="Client-safe Alias"
          icon={Building2}
          placeholder="Enter client-safe alias"
          error={getErrorMessage(errors.publicAlias)}
          {...register("publicAlias", textRules("Client-safe alias", { min: 3, max: 100 }))}
        />

        <FormInput
          label="Location"
          icon={MapPin}
          placeholder="Enter project location"
          error={getErrorMessage(errors.location)}
          {...register("location", textRules("Location", { min: 2, max: 100 }))}
        />

        <FormInput
          label="Area"
          icon={MapPin}
          placeholder="Enter area name"
          error={getErrorMessage(errors.area)}
          {...register("area", textRules("Area", { min: 2, max: 80 }))}
        />

        <SelectDropdown
          label="Property Type"
          icon={Shapes}
          options={propertyTypes}
          error={getErrorMessage(errors.propertyType)}
          {...register("propertyType", selectRules("Property type"))}
        />

        <FormInput
          label="Configuration"
          icon={Shapes}
          placeholder="3 BHK / 4 BHK"
          error={getErrorMessage(errors.configuration)}
          {...register("configuration", textRules("Configuration", { min: 3, max: 60 }))}
        />

        <FormInput
          label="Size Min"
          placeholder="Minimum size (sq ft)"
          error={getErrorMessage(errors.sizeRange?.min)}
          {...register("sizeRange.min", numberRules("Minimum size", { required: true, min: 1 }))}
        />

        <FormInput
          label="Size Max"
          placeholder="Maximum size (sq ft)"
          error={getErrorMessage(errors.sizeRange?.max)}
          {...register("sizeRange.max", {
            ...numberRules("Maximum size", { required: true, min: 1 }),
            validate: (value) => {
              const baseValidation = numberRules("Maximum size", { required: true, min: 1 }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              return Number(value) >= Number(sizeMin) || "Maximum size must be greater than or equal to minimum size";
            },
          })}
        />

        <FormInput
          label="Price Min"
          icon={Wallet}
          placeholder="Minimum price"
          error={getErrorMessage(errors.priceRange?.min)}
          {...register("priceRange.min", numberRules("Minimum price", { required: true, min: 1 }))}
        />

        <FormInput
          label="Price Max"
          icon={Wallet}
          placeholder="Maximum price"
          error={getErrorMessage(errors.priceRange?.max)}
          {...register("priceRange.max", {
            ...numberRules("Maximum price", { required: true, min: 1 }),
            validate: (value) => {
              const baseValidation = numberRules("Maximum price", { required: true, min: 1 }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              return Number(value) >= Number(priceMin) || "Maximum price must be greater than or equal to minimum price";
            },
          })}
        />

        <FormInput
          label="Total Plot Size"
          placeholder="Enter total plot size (sq yd)"
          error={getErrorMessage(errors.totalPlotSize)}
          {...register("totalPlotSize", textRules("Total plot size", { min: 1, max: 50, required: false }))}
        />

        <FormInput
          label="Total Blocks"
          placeholder="Enter number of blocks"
          error={getErrorMessage(errors.totalBlocks)}
          {...register("totalBlocks", numberRules("Total blocks", { required: true, min: 0, integer: true }))}
        />

        <FormInput
          label="Total Units"
          placeholder="Enter total units"
          error={getErrorMessage(errors.totalUnits)}
          {...register("totalUnits", numberRules("Total units", { required: true, min: 1, integer: true }))}
        />

        <FormInput
          label="Available Units"
          placeholder="Enter available units"
          error={getErrorMessage(errors.availableUnits)}
          {...register("availableUnits", {
            ...numberRules("Available units", { required: true, min: 0, integer: true }),
            validate: (value) => {
              const baseValidation = numberRules("Available units", { required: true, min: 0, integer: true }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              return Number(value) <= Number(totalUnits || 0) || "Available units cannot exceed total units";
            },
          })}
        />

        <FormInput
          label="Possession Date"
          icon={CalendarDays}
          type="date"
          error={getErrorMessage(errors.possessionDate)}
          {...register("possessionDate", dateRules("Possession date", { required: true }))}
        />

        <SelectDropdown
          label="Status"
          options={projectStatuses}
          error={getErrorMessage(errors.status)}
          {...register("status", selectRules("Status"))}
        />

        <FormInput
          label="Amenities"
          className="lg:col-span-2"
          placeholder="Clubhouse, Pool, Gym, Garden"
          error={getErrorMessage(errors.amenities)}
          {...register("amenities", textRules("Amenities", { min: 3, max: 300 }))}
        />

        <FormInput
          label="Sample House Video URL"
          className="lg:col-span-2"
          placeholder="Paste YouTube / Drive link"
          error={getErrorMessage(errors.sampleHouseVideoUrl)}
          {...register("sampleHouseVideoUrl", textRules("Sample house video URL", { min: 10, max: 300, required: false }))}
        />

        <FormInput
          label="Builder Details"
          className="lg:col-span-2"
          placeholder="Enter builder / developer details"
          error={getErrorMessage(errors.builderDetails)}
          {...register("builderDetails", textRules("Builder details", { min: 3, max: 300, required: false }))}
        />

        <FormInput
          label="Internal Notes"
          className="lg:col-span-2"
          placeholder="Add internal notes (not visible to client)"
          error={getErrorMessage(errors.internalNotes)}
          {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
        />

        <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
          <UploadBox label="Brochure Upload" helpText="Upload project brochure (PDF)" />
          <UploadBox label="Floor Plans" helpText="Upload floor plans (image/PDF)" />
          <UploadBox label="Project Images" helpText="Upload project visuals & renders" />
        </div>

        {formError ? <p className="lg:col-span-2 text-sm text-rose-300">{formError}</p> : null}

        <div className="lg:col-span-2">
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
