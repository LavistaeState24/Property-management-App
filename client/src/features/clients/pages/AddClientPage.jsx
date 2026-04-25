import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { clientStatuses, propertyTypes } from "../../../constants/theme";
import { clientService } from "../../../services/clientService";

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

export default function AddClientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await clientService.create({
        ...form,
        budgetMin: Number(form.budgetMin || 0),
        budgetMax: Number(form.budgetMax || 0),
      });
      navigate("/clients");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Lead Intake</p>
        <h2 className="mt-2 font-display text-3xl">Add a qualified client profile</h2>
      </div>

      <form className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass lg:grid-cols-2" onSubmit={handleSubmit}>
        <FormInput label="Client Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <FormInput label="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        <FormInput label="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
        <FormInput label="Requirement" value={form.requirement} onChange={(event) => setForm((prev) => ({ ...prev, requirement: event.target.value }))} />
        <FormInput label="Budget Min" value={form.budgetMin} onChange={(event) => setForm((prev) => ({ ...prev, budgetMin: event.target.value }))} />
        <FormInput label="Budget Max" value={form.budgetMax} onChange={(event) => setForm((prev) => ({ ...prev, budgetMax: event.target.value }))} />
        <FormInput label="Preferred Area" value={form.preferredArea} onChange={(event) => setForm((prev) => ({ ...prev, preferredArea: event.target.value }))} />
        <SelectDropdown label="Property Type" value={form.propertyType} options={propertyTypes} onChange={(event) => setForm((prev) => ({ ...prev, propertyType: event.target.value }))} />
        <FormInput label="Follow-up Date" type="date" value={form.followUpDate} onChange={(event) => setForm((prev) => ({ ...prev, followUpDate: event.target.value }))} />
        <SelectDropdown label="Status" value={form.status} options={clientStatuses} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} />
        <FormInput label="Notes" className="lg:col-span-2" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        {error ? <p className="lg:col-span-2 text-sm text-rose-300">{error}</p> : null}
        <div className="lg:col-span-2">
          <Button disabled={submitting}>{submitting ? "Saving..." : "Save Client"}</Button>
        </div>
      </form>
    </div>
  );
}

