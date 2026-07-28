import { useState } from "react";
import ProjectCard from "./ProjectCard";
import AddProjectPage from "../pages/AddProjectPage";
import ProjectDetailPage from "../pages/ProjectDetailPage";

// Section projets avec onglets En cours / Réussis / Abandonnés
export default function ProjectsSection({ projects, gyms, userId, onChanged, spots = [], locations = [], sectors = [] }) {
  const [tab, setTab]           = useState("en_cours"); // "en_cours" | "reussi" | "abandonne"
  const [addingProject, setAddingProject]   = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Filtre les projets selon l'onglet actif
  const filtered = projects.filter(p => p.status === tab);

  // Si on est sur le détail d'un projet
  if (selectedProject) {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) { setSelectedProject(null); return null; }
    return (
      <ProjectDetailPage
        project={project}
        userId={userId}
        gyms={gyms}
        onChanged={onChanged}
        onBack={() => setSelectedProject(null)}
        onEdit={() => { setEditingProject(project); setSelectedProject(null); }}
      />
    );
  }

  // Si on ajoute ou modifie un projet
  if (addingProject || editingProject) {
    return (
      <AddProjectPage
        userId={userId}
        gyms={gyms}
        spots={spots}
        locations={locations}
        sectors={sectors}
        editProject={editingProject}
        onSaved={() => { setAddingProject(false); setEditingProject(null); onChanged(); }}
        onCancel={() => { setAddingProject(false); setEditingProject(null); }}
      />
    );
  }

  return (
    <div>
      {/* Header avec bouton d'ajout */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mes projets</h2>
        <button className="btn-icon" onClick={() => setAddingProject(true)} aria-label="Nouveau projet">＋</button>
      </div>

      {/* Onglets statut */}
      <div className="settings-tabs" style={{ margin: "0 16px 16px" }}>
        <button className={`stab ${tab === "en_cours"  ? "stab-active" : ""}`} onClick={() => setTab("en_cours")}>
          En cours
        </button>
        <button className={`stab ${tab === "reussi"    ? "stab-active" : ""}`} onClick={() => setTab("reussi")}>
          Réussis
        </button>
        <button className={`stab ${tab === "abandonne" ? "stab-active" : ""}`} onClick={() => setTab("abandonne")}>
          Abandonnés
        </button>
      </div>

      {/* Liste des projets */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🎯</p>
          <p className="empty-title">
            {tab === "en_cours"  ? "Aucun projet en cours." :
             tab === "reussi"    ? "Aucun projet réussi." :
             "Aucun projet abandonné."}
          </p>
          {tab === "en_cours" && (
            <button className="btn-primary" onClick={() => setAddingProject(true)}>
              Ajouter un projet
            </button>
          )}
        </div>
      ) : (
        <div className="ascents-list">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => setSelectedProject(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}