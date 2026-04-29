import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdvancedDataTable from "../../../components/common/AdvancedDataTable";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
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
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProjects = async (params = filters) => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await projectService.list(params);
      setProjects(data.items);
    } catch (requestError) {
      setListError(requestError.response?.data?.message || "Unable to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await projectService.remove(projectToDelete._id);
      setProjects((currentProjects) => currentProjects.filter((project) => project._id !== projectToDelete._id));
      setProjectToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || "Unable to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const actionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-2";
  const deleteActionButtonClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300";

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
      searchValue: (row) => `${row.projectName} ${row.publicAlias}`,
    },
    { key: "location", label: "Location" },
    {
      key: "configuration",
      label: "Config",
      searchValue: (row) => `${row.configuration || ""} ${row.propertyType || ""}`,
      render: (row) => row.configuration || row.propertyType,
    },
    {
      key: "priceRange",
      label: "Price",
      searchValue: (row) => `${row.priceRange?.min || ""} ${row.priceRange?.max || ""}`,
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
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link to={`/projects/${row._id}`}>
            <button type="button" className={actionButtonClassName} title="View project" aria-label="View project">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Link>
          <Link to={`/projects/${row._id}/edit`}>
            <button type="button" className={actionButtonClassName} title="Edit project" aria-label="Edit project">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Link>
          <button
            type="button"
            className={deleteActionButtonClassName}
            onClick={() => {
              setDeleteError("");
              setProjectToDelete(row);
            }}
            title="Delete project"
            aria-label="Delete project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      searchable: false,
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
          <Button icon={Plus}>Add Project</Button>
        </Link>
      </div>

      <SearchFilter
        {...filters}
        propertyTypeOptions={propertyTypes}
        onSubmit={(formValues) => {
          setFilters(formValues);
          loadProjects(formValues);
        }}
      />

      {listError ? <p className="text-sm text-rose-300">{listError}</p> : null}
      <AdvancedDataTable
        columns={columns}
        rows={projects}
        loading={isLoading}
        loadingMessage="Loading projects..."
        emptyMessage="No projects found."
        searchPlaceholder="Search projects..."
        defaultRowsPerPage={10}
      />

      <Modal
        title="Delete Project"
        isOpen={Boolean(projectToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setProjectToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to delete this project?</p>
          {deleteError ? <p className="text-sm text-rose-300">{deleteError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setProjectToDelete(null);
                setDeleteError("");
              }}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button type="button" onClick={handleDeleteProject} disabled={isDeleting} className="bg-rose-500 text-white hover:opacity-90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
