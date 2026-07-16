import {
  Building2,
  MapPin,
  Wallet,
} from "lucide-react";

import Badge from "../common/Badge";

const formatPropertyTypes = (value) =>
  Array.isArray(value) ? value.join(", ") : value || "-";

const formatPrice = (value) => {
  if (!value?.min) return "-";

  if (!value.max || value.min === value.max) {
    return value.min.toLocaleString("en-IN");
  }

  return `${value.min.toLocaleString(
    "en-IN",
  )} - ${value.max.toLocaleString("en-IN")}`;
};

export default function ProjectCard({ project }) {
  return (
    <div className="rounded-[28px] border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            {project.location}
          </p>

          <h3 className="mt-2 font-display text-xl font-semibold text-heading">
            {project.projectName}
          </h3>
        </div>

        <Badge
          tone={
            project.status === "active"
              ? "green"
              : "slate"
          }
        >
          {project.status}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-body">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            Type
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <Building2 className="h-4 w-4" />
            </div>

            <p className="font-medium text-heading">
              {project.configuration ||
                formatPropertyTypes(
                  project.propertyType,
                )}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            Budget
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <Wallet className="h-4 w-4" />
            </div>

            <p className="font-medium text-heading">
              {formatPrice(project.priceRange)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}