import { Mail, MapPin, Phone, ScrollText, Sparkles, UserRound, Wallet } from "lucide-react";
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
        setLoadError(requestError.response?.data?.message || "Unable to load client details");
      }
    };

    loadClient();
  }, [id]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{loadError}</p>
        <Button variant="secondary" onClick={() => navigate("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  if (!client) {
    return <p className="text-sm text-muted">Loading client details...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{client.preferredArea}</p>
          <h2 className="mt-2 font-display text-4xl">{client.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">{client.status}</Badge>
          <Link to={`/clients/${client._id}/edit`}>
            <Button>Edit Client</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold-2" />
            <h3 className="font-display text-2xl">Client Profile</h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Client Name", client.name, UserRound],
              ["Phone", client.phone, Phone],
              ["Email", client.email, Mail],
              ["Requirement", client.requirement, ScrollText],
              ["Preferred Area", client.preferredArea, MapPin],
              ["Property Type", client.propertyType, Sparkles],
              ["Budget", `${client.budgetMin || "-"} - ${client.budgetMax || "-"}`, Wallet],
              ["Follow-up Date", client.followUpDate ? new Date(client.followUpDate).toLocaleDateString("en-IN") : "Not added", ScrollText],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gold-2" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {label}
                  </p>
                </div>
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
            <h3 className="font-display text-2xl">Notes</h3>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Client Notes</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium text-ivory">
              {client.notes || "No notes added"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
