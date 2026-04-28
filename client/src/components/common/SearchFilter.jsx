import { Building2, Landmark, Search, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { getErrorMessage, numberRules, textRules } from "../../utils/validation";
import Button from "./Button";
import FormInput from "./FormInput";
import SelectDropdown from "./SelectDropdown";

export default function SearchFilter({
  area,
  propertyType,
  bhk,
  minBudget,
  maxBudget,
  propertyTypeOptions,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      area,
      propertyType,
      bhk,
      minBudget,
      maxBudget,
    },
  });

  const watchedMinBudget = watch("minBudget");

  useEffect(() => {
    reset({
      area,
      propertyType,
      bhk,
      minBudget,
      maxBudget,
    });
  }, [area, propertyType, bhk, minBudget, maxBudget, reset]);

  return (
    <form
      className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass md:grid-cols-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormInput
        label="Area"
        icon={Landmark}
        error={getErrorMessage(errors.area)}
        {...register("area", textRules("Area", { min: 2, max: 80, required: false }))}
      />
      <FormInput
        label="BHK"
        icon={Building2}
        placeholder="3 BHK"
        error={getErrorMessage(errors.bhk)}
        {...register("bhk", textRules("BHK", { min: 3, max: 20, required: false }))}
      />
      <SelectDropdown
        label="Type"
        icon={Building2}
        options={propertyTypeOptions}
        error={getErrorMessage(errors.propertyType)}
        {...register("propertyType")}
      />
      <FormInput
        label="Min Budget"
        icon={Wallet}
        placeholder="9000000"
        error={getErrorMessage(errors.minBudget)}
        {...register("minBudget", numberRules("Minimum budget", { required: false, min: 0 }))}
      />
      <div className="flex items-end gap-3">
        <FormInput
          label="Max Budget"
          icon={Wallet}
          placeholder="11000000"
          error={getErrorMessage(errors.maxBudget)}
          {...register("maxBudget", {
            ...numberRules("Maximum budget", { required: false, min: 0 }),
            validate: (value) => {
              const baseValidation = numberRules("Maximum budget", { required: false, min: 0 }).validate(value);

              if (baseValidation !== true) {
                return baseValidation;
              }

              if (value === "" || watchedMinBudget === "") {
                return true;
              }

              return Number(value) >= Number(watchedMinBudget) || "Maximum budget must be at least minimum budget";
            },
          })}
        />
        <Button className="mb-0.5" icon={Search} disabled={isSubmitting}>
          Search
        </Button>
      </div>
    </form>
  );
}
