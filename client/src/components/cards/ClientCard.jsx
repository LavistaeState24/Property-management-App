import Badge from "../common/Badge";

export default function ClientCard({ client }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ivory">{client.name}</h3>
          <p className="mt-1 text-sm text-muted">{client.phone}</p>
        </div>
        <Badge tone="gold">{client.status}</Badge>
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <p>Area: <span className="text-ivory">{client.preferredArea || "Not specified"}</span></p>
        <p>Type: <span className="text-ivory">{client.propertyType || "Not specified"}</span></p>
        <p>Budget: <span className="text-ivory">{client.budgetMin || "-"} - {client.budgetMax || "-"}</span></p>
      </div>
    </div>
  );
}

