import Button from "./Button";
import FormInput from "./FormInput";
import SelectDropdown from "./SelectDropdown";

export default function SearchFilter({
  area,
  propertyType,
  bhk,
  minBudget,
  maxBudget,
  onChange,
  propertyTypeOptions,
  onSubmit,
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-5"
      onSubmit={onSubmit}
    >
      <FormInput label="Area" value={area} onChange={(event) => onChange("area", event.target.value)} />
      <FormInput label="BHK" value={bhk} onChange={(event) => onChange("bhk", event.target.value)} placeholder="3 BHK" />
      <SelectDropdown
        label="Type"
        value={propertyType}
        onChange={(event) => onChange("propertyType", event.target.value)}
        options={propertyTypeOptions}
      />
      <FormInput
        label="Min Budget"
        value={minBudget}
        onChange={(event) => onChange("minBudget", event.target.value)}
        placeholder="9000000"
      />
      <div className="flex items-end gap-3">
        <FormInput
          label="Max Budget"
          value={maxBudget}
          onChange={(event) => onChange("maxBudget", event.target.value)}
          placeholder="11000000"
        />
        <Button className="mb-0.5">Search</Button>
      </div>
    </form>
  );
}

