import { Building2, CalendarDays, MapPin, Save, Shapes, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import UploadBox from "../../../components/common/UploadBox";
import { projectStatuses, propertyTypes } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";
import { uploadService } from "../../../services/uploadService";
import {
  applyServerErrors,
  dateRules,
  getErrorMessage,
  httpsUrlRules,
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
  hasSampleVideo: "false",
  sampleVideoUrl: "",
  internalNotes: "",
  builderDetails: "",
  status: "active",
  brochure: null,
};

const mapProjectToForm = (project) => ({
  projectName: project.projectName || "",
  publicAlias: project.publicAlias || "",
  location: project.location || "",
  area: project.area || "",
  propertyType: project.propertyType || "",
  configuration: project.configuration || "",
  sizeRange: {
    min: project.sizeRange?.min?.toString() || "",
    max: project.sizeRange?.max?.toString() || "",
    unit: project.sizeRange?.unit || "sqft",
  },
  priceRange: {
    min: project.priceRange?.min?.toString() || "",
    max: project.priceRange?.max?.toString() || "",
    currencyLabel: project.priceRange?.currencyLabel || "INR",
  },
  totalPlotSize: project.totalPlotSize || "",
  totalBlocks: project.totalBlocks?.toString() || "",
  totalUnits: project.totalUnits?.toString() || "",
  availableUnits: project.availableUnits?.toString() || "",
  possessionDate: project.possessionDate ? new Date(project.possessionDate).toISOString().slice(0, 10) : "",
  amenities: Array.isArray(project.amenities) ? project.amenities.join(", ") : "",
  hasSampleVideo: project.hasSampleVideo ? "true" : "false",
  sampleVideoUrl: project.sampleVideoUrl || "",
  internalNotes: project.internalNotes || "",
  builderDetails: project.builderDetails || "",
  status: project.status || "active",
  brochure: project.brochure || null,
});

const normalizeBrochureAsset = (brochure) => {
  if (!brochure?.url) {
    return null;
  }

  return {
    ...brochure,
    name:
      brochure.name ||
      brochure.filename ||
      brochure.url.split("/").pop()?.replace(/^\d+-/, "") ||
      "Brochure.pdf",
  };
};

export default function AddProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoadingProject, setIsLoadingProject] = useState(isEditMode);
  const [brochureAsset, setBrochureAsset] = useState(null);
  const [brochureError, setBrochureError] = useState("");
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    reset,
  } = useForm({
    mode: "onBlur",
    shouldUnregister: true,
    defaultValues: initialState,
  });

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadProject = async () => {
      setIsLoadingProject(true);
      setLoadError("");

      try {
        const project = await projectService.getById(id);
        reset(mapProjectToForm(project));
        const normalizedBrochure = normalizeBrochureAsset(project.brochure);
        setBrochureAsset(normalizedBrochure);
        setValue("brochure", normalizedBrochure, { shouldDirty: false, shouldValidate: false });
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load project details");
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [id, isEditMode, reset]);

  const sizeMin = watch("sizeRange.min");
  const priceMin = watch("priceRange.min");
  const totalUnits = watch("totalUnits");
  const hasSampleVideo = watch("hasSampleVideo");

  useEffect(() => {
    if (sizeMin !== undefined) {
      trigger("sizeRange.max");
    }
  }, [sizeMin, trigger]);

  useEffect(() => {
    if (priceMin !== undefined) {
      trigger("priceRange.max");
    }
  }, [priceMin, trigger]);

  useEffect(() => {
    if (totalUnits !== undefined) {
      trigger("availableUnits");
    }
  }, [totalUnits, trigger]);

  const handleBrochureUpload = async (file) => {
    setBrochureError("");

    if (file.type !== "application/pdf") {
      setBrochureError("Only PDF brochure files are allowed");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setBrochureError("Brochure PDF must be 50MB or smaller");
      return;
    }

    setIsUploadingBrochure(true);

    try {
      const [uploadedAsset] = await uploadService.uploadFiles([file]);
      setBrochureAsset(uploadedAsset);
      setValue("brochure", uploadedAsset, { shouldDirty: true, shouldValidate: true });
    } catch (requestError) {
      setBrochureError(requestError.response?.data?.message || "Unable to upload brochure");
    } finally {
      setIsUploadingBrochure(false);
    }
  };

  const removeBrochure = () => {
    setBrochureAsset(null);
    setBrochureError("");
    setValue("brochure", null, { shouldDirty: true, shouldValidate: true });
  };

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
        brochure: brochureAsset || null,
        hasSampleVideo: formValues.hasSampleVideo === "true",
        sampleVideoUrl: formValues.hasSampleVideo === "true" ? formValues.sampleVideoUrl : null,
      };

      if (isEditMode) {
        await projectService.update(id, payload);
        navigate(`/projects/${id}`);
        return;
      }

      await projectService.create(payload);
      navigate("/projects");
    } catch (requestError) {
      applyServerErrors(requestError, setError, setFormError);
    }
  };

  if (isLoadingProject) {
    return <p className="text-sm text-muted">Loading project details...</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {isEditMode ? "Inventory Editing" : "Inventory Onboarding"}
        </p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update premium project details" : "Add a premium project Details"}
        </h2>
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
          type="number"
          placeholder="Minimum size (sq ft)"
          error={getErrorMessage(errors.sizeRange?.min)}
          {...register("sizeRange.min", numberRules("Minimum size", { required: true, min: 1 }))}
        />

        <FormInput
          label="Size Max"
          type="number"
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
          type="number"
          placeholder="Minimum price"
          error={getErrorMessage(errors.priceRange?.min)}
          {...register("priceRange.min", numberRules("Minimum price", { required: true, min: 1 }))}
        />

        <FormInput
          label="Price Max"
          icon={Wallet}
          type="number"
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
          type="number"
          placeholder="Enter number of blocks"
          error={getErrorMessage(errors.totalBlocks)}
          {...register("totalBlocks", numberRules("Total blocks", { required: true, min: 0, integer: true }))}
        />

        <FormInput
          label="Total Units"
          type="number"
          placeholder="Enter total units"
          error={getErrorMessage(errors.totalUnits)}
          {...register("totalUnits", numberRules("Total units", { required: true, min: 1, integer: true }))}
        />

        <FormInput
          label="Available Units"
          type="number"
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
          className="lg:col-span-1"
          placeholder="Clubhouse, Pool, Gym, Garden"
          error={getErrorMessage(errors.amenities)}
          {...register("amenities", textRules("Amenities", { min: 3, max: 300 }))}
        />

        <div className="flex flex-col gap-2 lg:col-span-1">
          <span className="text-md text-muted">Sample House Video</span>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm text-ivory">
                <input
                  type="radio"
                  value="true"
                  className="h-4 w-4 accent-[#c9a35d]"
                  {...register("hasSampleVideo", { required: "Sample house video selection is required" })}
                />
                <span>Add Video URL</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-ivory">
                <input
                  type="radio"
                  value="false"
                  className="h-4 w-4 accent-[#c9a35d]"
                  {...register("hasSampleVideo", { required: "Sample house video selection is required" })}
                />
                <span>No Video Available</span>
              </label>
            </div>
            {errors.hasSampleVideo ? (
              <p className="mt-3 text-sm text-rose-300">{getErrorMessage(errors.hasSampleVideo)}</p>
            ) : null}
          </div>
          {hasSampleVideo === "true" ? (
            <FormInput
              label="Video URL"
              placeholder="Paste YouTube / Vimeo / HTTPS link"
              error={getErrorMessage(errors.sampleVideoUrl)}
              {...register("sampleVideoUrl", httpsUrlRules("Video URL", { required: true }))}
            />
          ) : null}
        </div>

        <FormInput
          label="Builder Details"
          className="lg:col-span-1"
          placeholder="Enter builder / developer details"
          error={getErrorMessage(errors.builderDetails)}
          {...register("builderDetails", textRules("Builder details", { min: 3, max: 300, required: false }))}
        />

        <FormInput
          label="Internal Notes"
          className="lg:col-span-1"
          placeholder="Add internal notes (not visible to client)"
          error={getErrorMessage(errors.internalNotes)}
          {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <input type="hidden" {...register("brochure")} />
          <UploadBox
            label="Brochure Upload"
            helpText="Click to upload or drag and drop a PDF brochure up to 50MB"
            asset={brochureAsset}
            uploading={isUploadingBrochure}
            error={brochureError || getErrorMessage(errors.brochure)}
            onFileChange={handleBrochureUpload}
            onRemove={removeBrochure}
          />
        </div>

        {formError ? <p className="lg:col-span-2 text-sm text-rose-300">{formError}</p> : null}

        <div className="lg:col-span-2 flex justify-end gap-3 text-right">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/projects/${id}`)}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Project" : "Save Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
