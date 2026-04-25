import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import { projectService } from "../../../services/projectService";
import { shareService } from "../../../services/shareService";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      const data = await projectService.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);

  const handleGenerateShare = async () => {
    const data = await shareService.create({ projectId: id });
    setShareData(data);
    setIsShareOpen(true);
  };

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{project.location}</p>
          <h2 className="mt-2 font-display text-4xl">{project.projectName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">{project.status}</Badge>
          <Button onClick={handleGenerateShare}>Generate Client Link</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <h3 className="font-display text-2xl">Project intelligence</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Configuration</p>
              <p className="mt-2 text-lg text-ivory">{project.configuration || project.propertyType}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Budget</p>
              <p className="mt-2 text-lg text-ivory">
                {project.priceRange?.min?.toLocaleString("en-IN")} - {project.priceRange?.max?.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Amenities</p>
              <p className="mt-2 text-lg text-ivory">{project.amenities?.join(", ") || "Not added"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <h3 className="font-display text-2xl">Internal controls</h3>
          <div className="mt-5 space-y-4 text-sm text-muted">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Builder Details</p>
              <p className="mt-2 text-ivory">{project.builderDetails || "Not added"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Internal Notes</p>
              <p className="mt-2 text-ivory">{project.internalNotes || "Not added"}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal title="Client Share Link" isOpen={isShareOpen} onClose={() => setIsShareOpen(false)}>
        {shareData ? (
          <div className="space-y-4 text-sm text-muted">
            <p>Share URL</p>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-ivory">{shareData.shareUrl}</div>
            <p>Token: <span className="text-ivory">{shareData.token}</span></p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

