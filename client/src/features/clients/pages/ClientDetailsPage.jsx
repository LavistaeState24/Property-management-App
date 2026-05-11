import { Building2, CalendarDays, MapPin, Phone, Ruler, ScrollText, Shapes, Sparkles, UserRound, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { clientService } from "../../../services/clientService";

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadClient = async () => {
      setLoadError("");

      try {
        const data = await clientService.getById(id);
        setClient(data);
      } catch (requestError) {
        setLoadError(requestError.response?.data?.message || "Unable to load property details");
      }
    };

    loadClient();
  }, [id]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Properties
        </Button>
      </div>
    );
  }

  if (!client) {
    return <p className="text-sm text-muted">Loading property details...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{client.premiseArea}</p>
          <h2 className="mt-2 font-display text-4xl">{client.premiseName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">{client.sourceOfProperty}</Badge>
          <Badge tone="slate">{client.propertyStatus || "Status Pending"}</Badge>
          <Link to={`/clients/${client._id}/edit`}>
            <Button>Edit Property</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Property Profile</h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Owner Name", client.ownerName, UserRound],
              ["Address", client.address, MapPin],
              ["Premise Name", client.premiseName, Building2],
              ["Premise Area", client.premiseArea, MapPin],
              ["Source of Property", client.sourceOfProperty, Shapes],
              ["Property Type", client.propertyType, Sparkles],
              ["Client Phone Number", client.clientPhoneNumber, Phone],
              ["Property Status", client.propertyStatus, Shapes],
              ["Owner Price", client.ownerPrice?.toLocaleString("en-IN"), Wallet],
              ["Property Condition", client.propertyCondition, Shapes],
              ["Property Age", client.propertyAge, ScrollText],
              ["Size of Property", client.propertySize, Ruler],
              ["Date of Adding Property", client.dateOfAddingProperty ? new Date(client.dateOfAddingProperty).toLocaleDateString("en-IN") : "Not added", CalendarDays],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gold-2" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
                </div>
                <p className="mt-2 break-words text-base font-medium text-ivory">{value || "Not added"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Intake Summary</h3>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Quick Summary</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
              {`${client.premiseName || "Property"} in ${client.premiseArea || "selected area"} listed by ${client.sourceOfProperty || "source not added"} for ${client.ownerPrice?.toLocaleString("en-IN") || "-"} with ${client.propertyCondition || "condition not added"} condition and ${client.propertyStatus || "status not added"} status.`}
            </p>
          </div>

          {client.internalNotes ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Internal Notes</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">{client.internalNotes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
