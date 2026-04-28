import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
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
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/projects/${row._id}`}>
            <Button variant="ghost" className="px-3 py-2 text-gold-2" icon={Eye}>
              View
            </Button>
          </Link>
          <Link to={`/projects/${row._id}/edit`}>
            <Button variant="ghost" className="px-3 py-2 text-gold-2" icon={Pencil}>
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="px-3 py-2 text-rose-300 hover:text-rose-200"
            icon={Trash2}
            onClick={() => {
              setDeleteError("");
              setProjectToDelete(row);
            }}
          >
            Delete
          </Button>
        </div>
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
      {isLoading ? (
        <p className="text-sm text-muted">Loading projects...</p>
      ) : (
        <DataTable columns={columns} rows={projects} />
      )}

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
