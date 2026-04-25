import { useState } from "react";
import { Building2, CalendarDays, MapPin, Save, Shapes, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import UploadBox from "../../../components/common/UploadBox";
import { projectStatuses, propertyTypes } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";

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
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateNested = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        totalBlocks: Number(form.totalBlocks || 0),
        totalUnits: Number(form.totalUnits || 0),
        availableUnits: Number(form.availableUnits || 0),
        sizeRange: {
          ...form.sizeRange,
          min: Number(form.sizeRange.min || 0),
          max: Number(form.sizeRange.max || 0),
        },
        priceRange: {
          ...form.priceRange,
          min: Number(form.priceRange.min || 0),
          max: Number(form.priceRange.max || 0),
        },
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await projectService.create(payload);
      navigate("/projects");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Inventory Onboarding</p>
        <h2 className="mt-2 font-display text-3xl">Add a premium project dossier</h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit}>
        <FormInput label="Project Name" icon={Building2} value={form.projectName} onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))} />
        <FormInput label="Client-safe Alias" icon={Building2} value={form.publicAlias} onChange={(event) => setForm((prev) => ({ ...prev, publicAlias: event.target.value }))} />
        <FormInput label="Location" icon={MapPin} value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
        <FormInput label="Area" icon={MapPin} value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} />
        <SelectDropdown label="Property Type" icon={Shapes} value={form.propertyType} options={propertyTypes} onChange={(event) => setForm((prev) => ({ ...prev, propertyType: event.target.value }))} />
        <FormInput label="Configuration" icon={Shapes} value={form.configuration} onChange={(event) => setForm((prev) => ({ ...prev, configuration: event.target.value }))} placeholder="3 BHK" />
        <FormInput label="Size Min" value={form.sizeRange.min} onChange={(event) => updateNested("sizeRange", "min", event.target.value)} />
        <FormInput label="Size Max" value={form.sizeRange.max} onChange={(event) => updateNested("sizeRange", "max", event.target.value)} />
        <FormInput label="Price Min" icon={Wallet} value={form.priceRange.min} onChange={(event) => updateNested("priceRange", "min", event.target.value)} />
        <FormInput label="Price Max" icon={Wallet} value={form.priceRange.max} onChange={(event) => updateNested("priceRange", "max", event.target.value)} />
        <FormInput label="Total Plot Size" value={form.totalPlotSize} onChange={(event) => setForm((prev) => ({ ...prev, totalPlotSize: event.target.value }))} />
        <FormInput label="Total Blocks" value={form.totalBlocks} onChange={(event) => setForm((prev) => ({ ...prev, totalBlocks: event.target.value }))} />
        <FormInput label="Total Units" value={form.totalUnits} onChange={(event) => setForm((prev) => ({ ...prev, totalUnits: event.target.value }))} />
        <FormInput label="Available Units" value={form.availableUnits} onChange={(event) => setForm((prev) => ({ ...prev, availableUnits: event.target.value }))} />
        <FormInput label="Possession Date" icon={CalendarDays} type="date" value={form.possessionDate} onChange={(event) => setForm((prev) => ({ ...prev, possessionDate: event.target.value }))} />
        <SelectDropdown label="Status" value={form.status} options={projectStatuses} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} />
        <FormInput label="Amenities" className="lg:col-span-2" value={form.amenities} onChange={(event) => setForm((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="Clubhouse, Pool, Concierge" />
        <FormInput label="Sample House Video URL" className="lg:col-span-2" value={form.sampleHouseVideoUrl} onChange={(event) => setForm((prev) => ({ ...prev, sampleHouseVideoUrl: event.target.value }))} />
        <FormInput label="Builder Details" className="lg:col-span-2" value={form.builderDetails} onChange={(event) => setForm((prev) => ({ ...prev, builderDetails: event.target.value }))} />
        <FormInput label="Internal Notes" className="lg:col-span-2" value={form.internalNotes} onChange={(event) => setForm((prev) => ({ ...prev, internalNotes: event.target.value }))} />
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
          <UploadBox label="Brochure Upload" helpText="Wire this to `/api/uploads` for PDFs and branded brochures." />
          <UploadBox label="Floor Plans" helpText="Attach image or PDF floor plans using the upload API." />
          <UploadBox label="Project Images" helpText="Upload hero images, lifestyle shots, and walkthrough stills." />
        </div>
        {error ? <p className="lg:col-span-2 text-sm text-rose-300">{error}</p> : null}
        <div className="lg:col-span-2">
          <Button disabled={submitting} icon={Save}>{submitting ? "Saving..." : "Save Project"}</Button>
        </div>
      </form>
    </div>
  );
}
