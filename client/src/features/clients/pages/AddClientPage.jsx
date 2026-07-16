import {
  Building2,
  CalendarDays,
  ClipboardList,
  ImagePlus,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Save,
  Shapes,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import PageSkeleton from "../../../components/common/PageSkeleton";
import SelectDropdown from "../../../components/common/SelectDropdown";
import {
  interestLevelOptions,
  leadPurposeOptions,
  leadStatusOptions,
  propertyConditionOptions,
  propertySourceOptions,
  propertyStatusOptions,
  propertyTypes,
  requirementTypeOptions,
} from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { clientService } from "../../../services/clientService";
import { resolveAssetUrl, uploadService } from "../../../services/uploadService";
import { userService } from "../../../services/userService";
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
import { formatCompactPrice } from "../clientPipeline";

const MAX_PROPERTY_IMAGES = 15;
const DIRECT_VIDEO_FILE_REGEX = /\.(mp4|m4v|mov|webm|ogg)(?:[?#].*)?$/i;

const getImageNameFromUrl = (url, index) => {
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").pop();

    return fileName || `Property image ${index + 1}`;
  } catch {
    return `Property image ${index + 1}`;
  }
};

const getVideoNameFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || "House video";
  } catch {
    return "House video";
  }
};

const normalizePropertyImageAssets = (propertyImages = []) =>
  (Array.isArray(propertyImages) ? propertyImages : [])
    .filter(Boolean)
    .map((url, index) => ({
      name: getImageNameFromUrl(url, index),
      url,
    }));

const normalizeHouseVideoAsset = (houseVideo) => {
  if (!houseVideo) {
    return null;
  }

  return {
    name: getVideoNameFromUrl(houseVideo),
    url: houseVideo,
  };
};

const isDirectVideoUrl = (url) => DIRECT_VIDEO_FILE_REGEX.test(String(url || ""));

const initialState = {
  ownerName: "",
  clientPhoneNumber: "",
  email: "",
  address: "",
  premiseName: "",
  premiseArea: "",
  sourceOfProperty: "",
  propertyType: "",
  ownerPrice: "",
  propertyCondition: "",
  propertyAge: "",
  propertySize: "",
  propertyImages: [],
  houseVideo: "",
  internalNotes: "",
  propertyStatus: "",
  dateOfAddingProperty: "",
  assignedStaff: "",
  leadStatus: "New Lead",
  interestLevel: "Warm",
  source: "",
  purpose: "",
  budgetMin: "",
  budgetMax: "",
  requirementType: "",
  areaPreference: "",
  notes: "",
  lastCallStatus: "",
  nextFollowUpDate: "",
};

const mapClientToForm = (client) => ({
  ownerName: client.ownerName || "",
  clientPhoneNumber: client.clientPhoneNumber || "",
  email: client.email || "",
  address: client.address || "",
  premiseName: client.premiseName || "",
  premiseArea: client.premiseArea || "",
  sourceOfProperty: client.sourceOfProperty || "",
  propertyType: client.propertyType || "",
  ownerPrice: client.ownerPrice?.toString() || "",
  propertyCondition: client.propertyCondition || "",
  propertyAge: client.propertyAge || "",
  propertySize: client.propertySize || "",
  propertyImages: Array.isArray(client.propertyImages) ? client.propertyImages : [],
  houseVideo: client.houseVideo || "",
  internalNotes: client.internalNotes || "",
  propertyStatus: client.propertyStatus || "",
  dateOfAddingProperty: client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toISOString().slice(0, 10) : "",
  assignedStaff: client.assignedStaff?._id || client.assignedStaff || "",
  leadStatus: client.leadStatus || "New Lead",
  interestLevel: client.interestLevel || "Warm",
  source: client.source || "",
  purpose: client.purpose || "",
  budgetMin: client.budgetMin?.toString() || "",
  budgetMax: client.budgetMax?.toString() || "",
  requirementType: client.requirementType || "",
  areaPreference: client.areaPreference || "",
  notes: client.notes || "",
  lastCallStatus: client.lastCallStatus || "",
  nextFollowUpDate: client.nextFollowUpDate ? new Date(client.nextFollowUpDate).toISOString().slice(0, 10) : "",
});

export default function AddClientPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const isSalesEditMode = isEditMode && user?.role === "sales";
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [staffOptions, setStaffOptions] = useState([]);
  const [propertyImageAssets, setPropertyImageAssets] = useState([]);
  const [propertyImagesError, setPropertyImagesError] = useState("");
  const [isUploadingPropertyImages, setIsUploadingPropertyImages] = useState(false);
  const [houseVideoAsset, setHouseVideoAsset] = useState(null);
  const [houseVideoError, setHouseVideoError] = useState("");
  const [isUploadingHouseVideo, setIsUploadingHouseVideo] = useState(false);
  const [houseVideoUploadProgress, setHouseVideoUploadProgress] = useState(0);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
    setValue,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialState,
  });

  const syncPropertyImages = (assets, options = {}) => {
    setPropertyImageAssets(assets);
    setValue(
      "propertyImages",
      assets.map((asset) => asset.url),
      {
        shouldDirty: options.shouldDirty ?? true,
        shouldValidate: options.shouldValidate ?? true,
      }
    );
  };

  const syncHouseVideo = (asset, options = {}) => {
    setHouseVideoAsset(asset);
    setValue("houseVideo", asset?.url || "", {
      shouldDirty: options.shouldDirty ?? true,
      shouldValidate: options.shouldValidate ?? true,
    });
  };

  useEffect(() => {
    const loadPage = async () => {
      setIsLoadingPage(true);
      setLoadError("");

      try {
        const [assignableUsers, client] = await Promise.all([
          userService.listAssignable(),
          isEditMode ? clientService.getById(id) : Promise.resolve(null),
        ]);

        const nextStaffOptions = assignableUsers.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.role})`,
        }));

        setStaffOptions(nextStaffOptions);
        setPropertyImagesError("");
        setHouseVideoError("");
        setHouseVideoUploadProgress(0);

        if (client) {
          reset(mapClientToForm(client));
          const normalizedAssets = normalizePropertyImageAssets(client.propertyImages);
          setPropertyImageAssets(normalizedAssets);
          setValue(
            "propertyImages",
            normalizedAssets.map((asset) => asset.url),
            { shouldDirty: false, shouldValidate: false }
          );
          syncHouseVideo(normalizeHouseVideoAsset(client.houseVideo), {
            shouldDirty: false,
            shouldValidate: false,
          });
        } else {
          reset(initialState);
          setPropertyImageAssets([]);
          setValue("propertyImages", [], { shouldDirty: false, shouldValidate: false });
          syncHouseVideo(null, { shouldDirty: false, shouldValidate: false });

          if (assignableUsers.length === 1) {
            setValue("assignedStaff", assignableUsers[0].id, { shouldDirty: false });
          }
        }
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load lead details");
      } finally {
        setIsLoadingPage(false);
      }
    };

    loadPage();
  }, [id, isEditMode, reset, setValue]);

  const handlePropertyImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setPropertyImagesError("");

    if (propertyImageAssets.length + files.length > MAX_PROPERTY_IMAGES) {
      setPropertyImagesError(`You can upload up to ${MAX_PROPERTY_IMAGES} property images only`);
      return;
    }

    const invalidFile = files.find((file) => !String(file.type || "").startsWith("image/"));

    if (invalidFile) {
      setPropertyImagesError("Only image files are allowed");
      return;
    }

    setIsUploadingPropertyImages(true);

    try {
      const uploadedAssets = await uploadService.uploadLeadPropertyImages(files, {
        onProgress: () => {},
      });
      const nextAssets = [...propertyImageAssets, ...uploadedAssets];
      syncPropertyImages(nextAssets);
    } catch (requestError) {
      setPropertyImagesError(requestError.response?.data?.message || "Unable to upload property images");
    } finally {
      setIsUploadingPropertyImages(false);
    }
  };

  const removePropertyImage = (indexToRemove) => {
    setPropertyImagesError("");
    syncPropertyImages(propertyImageAssets.filter((_, index) => index !== indexToRemove));
  };

  const handleHouseVideoUpload = async (event) => {
    const [file] = Array.from(event.target.files || []);
    event.target.value = "";

    if (!file) {
      return;
    }

    setHouseVideoError("");
    setHouseVideoUploadProgress(0);

    if (!String(file.type || "").startsWith("video/")) {
      setHouseVideoError("Only video files are allowed");
      return;
    }

    setIsUploadingHouseVideo(true);

    try {
      const uploadedAsset = await uploadService.uploadLeadPropertyVideo(file, {
        onProgress: (progress) => setHouseVideoUploadProgress(progress),
      });

      if (!uploadedAsset?.url) {
        setHouseVideoError("Unable to upload house video");
        return;
      }

      syncHouseVideo(uploadedAsset);
      setHouseVideoUploadProgress(100);
    } catch (requestError) {
      setHouseVideoError(requestError.response?.data?.message || "Unable to upload house video");
      setHouseVideoUploadProgress(0);
    } finally {
      setIsUploadingHouseVideo(false);
    }
  };

  const removeHouseVideo = () => {
    setHouseVideoError("");
    setHouseVideoUploadProgress(0);
    syncHouseVideo(null);
  };

  const ownerPrice = watch("ownerPrice");
  const budgetMin = watch("budgetMin");

  const onSubmit = async (formValues) => {
    setFormError("");

    try {
      const payload = {
        ...formValues,
        ownerPrice: toOptionalNumber(formValues.ownerPrice),
        budgetMin: toOptionalNumber(formValues.budgetMin),
        budgetMax: toOptionalNumber(formValues.budgetMax),
        propertyImages: propertyImageAssets.map((asset) => asset.url),
        houseVideo: houseVideoAsset?.url || null,
      };

      if (!payload.assignedStaff) {
        delete payload.assignedStaff;
      }

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

  if (isLoadingPage) {
    return <PageSkeleton variant="form" />;
  }

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

  if (isSalesEditMode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Sales users can update leads from the lead details quick update panel only.</p>
        <Button variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
          Back to Lead Details
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-md tracking-[0.1em] text-gold">{isEditMode ? "Lead Editing" : "Lead Intake"}</p>
        <h2 className="mt-2 font-display text-3xl">
          {isEditMode ? "Update lead pipeline record" : "Create a new lead pipeline record"}
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="grid gap-5 rounded-[32px] border border-border bg-surface p-6 shadow-card lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Pipeline Control</p>
            <h3 className="mt-2 font-display text-2xl">Ownership, status, and requirement fit</h3>
          </div>

          <SelectDropdown
            label="Assigned Staff"
            icon={UserCheck}
            options={staffOptions}
            placeholder="Auto assign to creator"
            error={getErrorMessage(errors.assignedStaff)}
            {...register("assignedStaff")}
          />

          <SelectDropdown
            label="Lead Status"
            icon={ClipboardList}
            options={leadStatusOptions}
            error={getErrorMessage(errors.leadStatus)}
            {...register("leadStatus", selectRules("Lead status"))}
          />

          <SelectDropdown
            label="Interest Level"
            icon={Shapes}
            options={interestLevelOptions}
            error={getErrorMessage(errors.interestLevel)}
            {...register("interestLevel", selectRules("Interest level"))}
          />

          <FormInput
            label="Lead Source"
            icon={Shapes}
            placeholder="Website, referral, call, broker..."
            error={getErrorMessage(errors.source)}
            {...register("source", textRules("Lead source", { min: 0, max: 100, required: false }))}
          />

          <SelectDropdown
            label="Purpose"
            icon={Shapes}
            options={leadPurposeOptions}
            placeholder="Select purpose"
            error={getErrorMessage(errors.purpose)}
            {...register("purpose")}
          />

          <SelectDropdown
            label="Requirement Type"
            icon={Shapes}
            options={requirementTypeOptions}
            placeholder="Select requirement type"
            error={getErrorMessage(errors.requirementType)}
            {...register("requirementType")}
          />

          <FormInput
            label="Area Preference"
            icon={MapPin}
            placeholder="Preferred localities or micro-markets"
            error={getErrorMessage(errors.areaPreference)}
            {...register("areaPreference", textRules("Area preference", { min: 0, max: 120, required: false }))}
          />

          <div className="space-y-2">
            <FormInput
              label="Minimum Budget"
              icon={IndianRupee}
              type="number"
              placeholder="Enter minimum budget"
              error={getErrorMessage(errors.budgetMin)}
              {...register("budgetMin", numberRules("Minimum budget", { required: false, min: 0 }))}
            />
            {formatCompactPrice(budgetMin) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(budgetMin)}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <FormInput
              label="Maximum Budget"
              icon={IndianRupee}
              type="number"
              placeholder="Enter maximum budget"
              error={getErrorMessage(errors.budgetMax)}
              {...register("budgetMax", {
                ...numberRules("Maximum budget", { required: false, min: 0 }),
                validate: (value) => {
                  const baseValidation = numberRules("Maximum budget", { required: false, min: 0 }).validate(value);

                  if (baseValidation !== true) {
                    return baseValidation;
                  }

                  if (!value || !budgetMin) {
                    return true;
                  }

                  return Number(value) >= Number(budgetMin) || "Maximum budget must be at least minimum budget";
                },
              })}
            />
            {formatCompactPrice(watch("budgetMax")) ? (
              <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-2">
                {formatCompactPrice(watch("budgetMax"))}
              </div>
            ) : null}
          </div>

          <FormInput
            label="Lead Notes"
            as="textarea"
            rows={5}
            className="lg:col-span-2"
            placeholder="Conversation summary, next step, objections, urgency..."
            error={getErrorMessage(errors.notes)}
            {...register("notes", textRules("Notes", { min: 0, max: 2000, required: false }))}
          />

          <FormInput
            label="Last Call Status"
            placeholder="Answered, no response, busy..."
            error={getErrorMessage(errors.lastCallStatus)}
            {...register("lastCallStatus", textRules("Last call status", { min: 0, max: 120, required: false }))}
          />

          <FormInput
            label="Next Follow-up Date"
            type="date"
            error={getErrorMessage(errors.nextFollowUpDate)}
            {...register("nextFollowUpDate")}
          />
        </section>

        <section className="grid gap-5 rounded-[32px] border border-border bg-surface p-6 shadow-card lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Client Profile</p>
            <h3 className="mt-2 font-display text-2xl">Client Details</h3>
          </div>

          <FormInput
            label="Client Name"
            icon={UserRound}
            placeholder="Enter client name"
            error={getErrorMessage(errors.ownerName)}
            {...register("ownerName", textRules("Owner name", { min: 3, max: 80 }))}
          />

          <FormInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter phone number"
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
            label="Email"
            icon={Mail}
            type="email"
            placeholder="Enter client email"
            error={getErrorMessage(errors.email)}
            {...register("email", emailRules({ required: false }))}
          />

          <FormInput
            label="Address"
            icon={MapPin}
            placeholder="Enter address"
            error={getErrorMessage(errors.address)}
            {...register("address", textRules("Address", { min: 5, max: 200 }))}
          />

          <FormInput
            label="Premise Name"
            icon={Building2}
            placeholder="Enter premise or project name"
            error={getErrorMessage(errors.premiseName)}
            {...register("premiseName", textRules("Premise name", {  min: 0, max: 100, required: false}))}
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
              icon={IndianRupee}
              type="number"
              placeholder="Enter owner price"
              error={getErrorMessage(errors.ownerPrice)}
              {...register("ownerPrice", numberRules("Owner price", { min: 0 }))}
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
            placeholder="e.g. 1450 sq ft (optional)"
            error={getErrorMessage(errors.propertySize)}
            {...register("propertySize", textRules("Size of property", { min: 0, max: 80, required: false }))}
          />

          <FormInput
            label="Date Added"
            icon={CalendarDays}
            type="date"
            className="lg:col-span-2"
            error={getErrorMessage(errors.dateOfAddingProperty)}
            {...register("dateOfAddingProperty", dateRules("Date of adding property", { required: true }))}
          />

          <FormInput
            label="Internal Notes"
            as="textarea"
            rows={4}
            className="lg:col-span-2"
            placeholder="Internal context related to property intake"
            error={getErrorMessage(errors.internalNotes)}
            {...register("internalNotes", textRules("Internal notes", { min: 0, max: 500, required: false }))}
          />
        </section>

        <section className="grid gap-5 rounded-[32px] border border-border bg-surface p-6 shadow-card lg:grid-cols-2">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Property Media</p>
            <h3 className="mt-2 font-display text-2xl">Images and optional house video</h3>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-dashed border-gold/30 bg-black/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-gold-2" />
                  <p className="text-sm font-semibold text-heading">Property Images</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Upload up to {MAX_PROPERTY_IMAGES} property images. Existing project brochure uploads remain unchanged.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold-2 transition hover:bg-gold/20">
                {isUploadingPropertyImages ? "Uploading..." : "Add Images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePropertyImageUpload}
                  disabled={isUploadingPropertyImages || propertyImageAssets.length >= MAX_PROPERTY_IMAGES}
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <span className="text-muted">Uploaded images</span>
              <span className="font-medium text-heading">
                {propertyImageAssets.length}/{MAX_PROPERTY_IMAGES}
              </span>
            </div>

            {propertyImageAssets.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {propertyImageAssets.map((asset, index) => (
                  <div key={`${asset.url}-${index}`} className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                    <a href={resolveAssetUrl(asset.url)} target="_blank" rel="noreferrer">
                      <img
                        src={resolveAssetUrl(asset.url)}
                        alt={asset.name || `Property image ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                    </a>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="truncate text-sm text-heading">{asset.name || `Property image ${index + 1}`}</p>
                      <button
                        type="button"
                        onClick={() => removePropertyImage(index)}
                        className="rounded-full p-1 text-muted transition hover:bg-white/10 hover:text-heading"
                        aria-label={`Remove property image ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No property images uploaded yet.</p>
            )}

            {propertyImagesError ? <p className="mt-3 text-sm text-rose-300">{propertyImagesError}</p> : null}
            {getErrorMessage(errors.propertyImages) ? <p className="mt-3 text-sm text-rose-300">{getErrorMessage(errors.propertyImages)}</p> : null}
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-dashed border-gold/30 bg-black/10 p-5">
            <input type="hidden" {...register("houseVideo")} />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-gold-2" />
                  <p className="text-sm font-semibold text-heading">House Video Upload</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Upload one property video directly to S3. You can remove or replace it before saving the lead.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold-2 transition hover:bg-gold/20">
                {isUploadingHouseVideo ? "Uploading..." : houseVideoAsset ? "Replace Video" : "Upload Video"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleHouseVideoUpload}
                  disabled={isUploadingHouseVideo}
                />
              </label>
            </div>

            {isUploadingHouseVideo ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">Upload progress</span>
                  <span className="font-medium text-heading">{houseVideoUploadProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${houseVideoUploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {houseVideoAsset ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                {isDirectVideoUrl(houseVideoAsset.url) ? (
                  <video
                    className="max-h-[420px] w-full bg-black"
                    controls
                    src={resolveAssetUrl(houseVideoAsset.url)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex min-h-48 items-center justify-center bg-black px-6 py-10 text-center">
                    <div>
                      <p className="text-sm font-medium text-heading">Existing house video is linked from an external source.</p>
                      <a
                        href={resolveAssetUrl(houseVideoAsset.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-2 transition hover:bg-gold/20"
                      >
                        Open Current Video
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-heading">{houseVideoAsset.name || "House video"}</p>
                    <p className="truncate text-xs text-muted">{resolveAssetUrl(houseVideoAsset.url)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeHouseVideo}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-3 py-2 text-sm font-semibold text-muted transition hover:border-rose-300/40 hover:text-rose-200"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No house video uploaded yet.</p>
            )}

            {houseVideoError ? <p className="mt-3 text-sm text-rose-300">{houseVideoError}</p> : null}
            {getErrorMessage(errors.houseVideo) ? <p className="mt-3 text-sm text-rose-300">{getErrorMessage(errors.houseVideo)}</p> : null}
          </div>
        </section>

        {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

        <div className="flex justify-end gap-3 text-center">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
              Cancel
            </Button>
          ) : null}
          <Button disabled={isSubmitting} icon={Save}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Lead" : "Save Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
