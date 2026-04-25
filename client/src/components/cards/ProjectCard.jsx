import Badge from "../common/Badge";

export default function ProjectCard({ project }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">{project.location}</p>
          <h3 className="mt-2 font-display text-xl text-ivory">{project.projectName}</h3>
        </div>
        <Badge tone={project.status === "active" ? "green" : "slate"}>{project.status}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Type</p>
          <p className="mt-1 text-ivory">{project.configuration || project.propertyType}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Budget</p>
          <p className="mt-1 text-ivory">
            {project.priceRange?.min?.toLocaleString("en-IN")} - {project.priceRange?.max?.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

