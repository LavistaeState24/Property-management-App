import {
  BadgeIndianRupee,
  MapPin,
  Shapes,
} from "lucide-react";

import Badge from "../common/Badge";

export default function ClientCard({ client }) {
  return (
    <div className="rounded-[28px] border border-border bg-surface p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-heading">
            {client.ownerName}
          </h3>
        </div>

        <Badge tone="gold">
          {client.propertyCondition}
        </Badge>
      </div>

      <div className="mt-5 space-y-3 text-sm text-body">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <MapPin className="h-4 w-4" />
          </div>

          <p>
            Area:{" "}
            <span className="font-medium text-heading">
              {client.premiseArea || "Not specified"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <Shapes className="h-4 w-4" />
          </div>

          <p>
            Type:{" "}
            <span className="font-medium text-heading">
              {client.propertyType || "Not specified"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <BadgeIndianRupee className="h-4 w-4" />
          </div>

          <p>
            Budget:{" "}
            <span className="font-medium text-heading">
              {client.ownerPrice || "-"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}