import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import SearchFilter from "../../../components/common/SearchFilter";
import { propertyTypes } from "../../../constants/theme";
import { projectService } from "../../../services/projectService";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    area: "",
    propertyType: "",
    bhk: "",
    minBudget: "",
    maxBudget: "",
  });

  const loadProjects = async (params = filters) => {
    const data = await projectService.list(params);
    setProjects(data.items);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const columns = [
    {
      key: "projectName",
      label: "Project",
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.projectName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{row.publicAlias}</p>
        </div>
      ),
    },
    { key: "location", label: "Location" },
    {
      key: "configuration",
      label: "Config",
      render: (row) => row.configuration || row.propertyType,
    },
    {
      key: "priceRange",
      label: "Price",
      render: (row) => `${row.priceRange?.min?.toLocaleString("en-IN")} - ${row.priceRange?.max?.toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={row.status === "active" ? "green" : "slate"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Link className="text-gold-2" to={`/projects/${row._id}`}>
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Inventory Library</p>
          <h2 className="mt-2 font-display text-3xl">Search by requirement, not guesswork</h2>
        </div>
        <Link to="/projects/new">
          <Button>Add Project</Button>
        </Link>
      </div>

      <SearchFilter
        {...filters}
        propertyTypeOptions={propertyTypes}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(event) => {
          event.preventDefault();
          loadProjects();
        }}
      />

      <DataTable columns={columns} rows={projects} />
    </div>
  );
}

