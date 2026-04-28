import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link2, ScrollText, Send, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import Modal from "../../../components/common/Modal";
import { useAuth } from "../../../hooks/useAuth";
import { projectService } from "../../../services/projectService";
import { shareRecordService } from "../../../services/shareRecordService";
import { authStorage } from "../../../utils/storage";
import {
  applyServerErrors,
  emailRules,
  getErrorMessage,
  phoneRules,
  textRules,
} from "../../../utils/validation";

const formatWhatsAppPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const formatMessageSection = (emoji, label, value) => {
  if (!value) {
    return null;
  }

  return `${emoji} *${label}:* ${value}`;
};

const buildWhatsAppMessage = (safeProject) => {
  const amenitiesValue = safeProject.amenities?.length
    ? safeProject.amenities.join(", ")
    : null;

  const photosValue = safeProject.photos?.length
    ? safeProject.photos.join(", ")
    : null;

  const format = (label, value) =>
    value ? `• *${label}:* ${value}` : null;

  const lines = [
    "*Premium Property Details by Lavista Estate*",
    "",

    format("Area", safeProject.area),
    format("Configuration", safeProject.configuration),
    format("Size", safeProject.size),
    format("Price Range", safeProject.priceRange),
    format("Possession", safeProject.possession),
    format("Basic Amenities", amenitiesValue),
    format("Brochure", safeProject.brochureUrl),
    format("Sample House Video", safeProject.sampleVideoUrl),
    format("Photos", photosValue),

    "",
    "*For more details, contact:*",
    safeProject.contact?.name ? `*${safeProject.contact.name}*` : null,
    safeProject.contact?.phone || null,
    "",
    "Lavista Estate | WhatsApp for site visit and latest availability",
  ];

  return lines.filter(Boolean).join("\n");
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareError, setShareError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientRequirement: "",
    },
  });

  useEffect(() => {
    const loadProject = async () => {
      const data = await projectService.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);

  const handleWhatsAppShare = async (formValues) => {
    setShareError("");

    if (!authStorage.getRawToken()) {
      setShareError("Your session has expired. Please log in again before sharing.");
      return;
    }

    try {
      const safeProject = await projectService.getClientShare(id);
      const whatsappMessage = buildWhatsAppMessage(safeProject);

      await shareRecordService.create({
        clientName: formValues.clientName,
        clientPhone: formValues.clientPhone,
        clientEmail: formValues.clientEmail || undefined,
        clientRequirement: formValues.clientRequirement || undefined,
        projectId: id,
        projectPublicAlias: safeProject.publicAlias,
        sharedBy: user.id,
        sharedByName: user.name,
        sharedByPhone: user.phone,
        sharedFields: {
          area: safeProject.area,
          configuration: safeProject.configuration,
          size: safeProject.size,
          priceRange: safeProject.priceRange,
          possession: safeProject.possession,
          amenities: safeProject.amenities,
          brochureUrl: safeProject.brochureUrl,
          sampleVideoUrl: safeProject.sampleVideoUrl,
          photos: safeProject.photos,
        },
        shareChannel: "WhatsApp",
        whatsappMessage,
        status: "shared",
      });

      const whatsappUrl = `https://wa.me/${formatWhatsAppPhone(formValues.clientPhone)}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setIsShareOpen(false);
      reset();
    } catch (requestError) {
      applyServerErrors(requestError, setError, setShareError);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{project.location}</p>
          <h2 className="mt-2 font-display text-4xl">{project.projectName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">{project.status}</Badge>
          <Button onClick={() => setIsShareOpen(true)} icon={Link2}>
            Share Client
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Project Details</h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Project Name", project.projectName],
              ["Client-safe Alias", project.publicAlias],
              ["Location", project.location],
              ["Area", project.area],
              ["Property Type", project.propertyType],
              ["Configuration", project.configuration],
              ["Size Range", `${project.sizeRange?.min || "-"} - ${project.sizeRange?.max || "-"}`],
              ["Price Range", `${project.priceRange?.min?.toLocaleString("en-IN") || "-"} - ${project.priceRange?.max?.toLocaleString("en-IN") || "-"}`],
              ["Total Plot Size", project.totalPlotSize],
              ["Total Blocks", project.totalBlocks],
              ["Total Units", project.totalUnits],
              ["Available Units", project.availableUnits],
              ["Possession Date", project.possessionDate ? new Date(project.possessionDate).toLocaleDateString("en-IN") : "Not added"],
              ["Status", project.status],
              ["Amenities", Array.isArray(project.amenities) ? project.amenities.join(", ") : project.amenities],
              ["Sample House Video", project.sampleVideoUrl],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {label}
                </p>
                <p className="mt-2 break-words text-base font-medium text-ivory">
                  {value || "Not added"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Internal Details</h3>
          </div>

          <div className="mt-5 space-y-4">
            {[
              ["Builder Details", project.builderDetails],
              ["Internal Notes", project.internalNotes],
              ["Brochure", project.brochure?.url],
              ["Floor Plans", project.floorPlans?.length ? `${project.floorPlans.length} file(s) added` : ""],
              ["Project Images", project.projectImages?.length ? `${project.projectImages.length} image(s) added` : ""],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {label}
                </p>
                <p className="mt-2 break-words text-base font-medium text-ivory">
                  {value || "Not added"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title="Share Client-Safe Details" isOpen={isShareOpen} onClose={() => setIsShareOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit(handleWhatsAppShare)}>
          <FormInput
            label="Client Name"
            placeholder="Enter client name"
            error={getErrorMessage(errors.clientName)}
            {...register("clientName", textRules("Client name", { min: 3, max: 60 }))}
          />
          <FormInput
            label="Client WhatsApp Number"
            placeholder="Enter 10 digit mobile number"
            error={getErrorMessage(errors.clientPhone)}
            {...register("clientPhone", phoneRules())}
          />
          <FormInput
            label="Client Email"
            placeholder="Enter client email"
            error={getErrorMessage(errors.clientEmail)}
            {...register("clientEmail", emailRules({ required: false }))}
          />
          <FormInput
            label="Client Requirement"
            placeholder="Optional client requirement"
            error={getErrorMessage(errors.clientRequirement)}
            {...register("clientRequirement", textRules("Client requirement", { min: 3, max: 200, required: false }))}
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted">
            <p className="text-ivory">Shared by</p>
            <p className="mt-2">{user?.name}</p>
            <p>{user?.phone}</p>
          </div>

          {shareError ? <p className="text-sm text-rose-300">{shareError}</p> : null}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} icon={Send}>
              {isSubmitting ? "Preparing..." : "Open WhatsApp"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
