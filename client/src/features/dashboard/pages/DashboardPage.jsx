import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarClock, FolderKanban, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../../components/common/Button";
import StatCard from "../../../components/common/StatCard";
import ProjectCard from "../../../components/cards/ProjectCard";
import ClientCard from "../../../components/cards/ClientCard";
import { projectService } from "../../../services/projectService";
import { clientService } from "../../../services/clientService";
import { followupService } from "../../../services/followupService";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [followups, setFollowups] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const [summaryData, projectData, clientData, followupData] = await Promise.all([
        projectService.dashboardSummary(),
        projectService.list({ limit: 3 }),
        clientService.list({ limit: 3 }),
        followupService.list({ today: true }),
      ]);

      setSummary(summaryData);
      setProjects(projectData.items);
      setClients(clientData.items);
      setFollowups(followupData);
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Projects" value={summary?.totalProjects ?? "--"} accent="gold" meta="Inventory" icon={FolderKanban} />
        <StatCard label="Active Projects" value={summary?.activeProjects ?? "--"} accent="green" meta="Live" icon={TrendingUp} />
        <StatCard
          label="Upcoming Launches"
          value={summary?.upcomingProjects ?? "--"}
          accent="wine"
          meta="Pipeline"
          icon={CalendarClock}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Inventory Picks</p>
              <h3 className="mt-2 font-display text-2xl">Fresh project additions</h3>
            </div>
            <Link to="/projects">
              <Button variant="secondary" icon={Building2} iconRight={ArrowRight}>
                View all
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-gold-2" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Today</p>
                <h3 className="mt-2 font-display text-2xl">Follow-up radar</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {followups.length ? (
                followups.map((followup) => (
                  <div key={followup._id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-ivory">{followup.client?.name}</p>
                    <p className="mt-1 text-sm text-muted">{followup.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No follow-ups due today.</p>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gold-2" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gold">Leads</p>
                  <h3 className="mt-2 font-display text-2xl">Priority clients</h3>
                </div>
              </div>
              <Link to="/clients">
                <Button variant="secondary" icon={Users} iconRight={ArrowRight}>
                  View all
                </Button>
              </Link>
            </div>
            <div className="mt-5 grid gap-4">
              {clients.map((client) => (
                <ClientCard key={client._id} client={client} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
