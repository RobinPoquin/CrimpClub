import { useState } from "react";
import AscentCard from "../components/AscentCard";

const TYPE_FILTERS = ["Tous", "Bloc", "Diff", "Trad", "Grande voie"];

export default function LogbookPage({ ascents, gyms = [], onAdd, onEdit, onDelete }) {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = ascents.filter((a) => {
    const matchType = filter === "Tous" || a.type === filter;
    const matchSearch =
      !search ||
      a.routeName?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase()) ||
      a.grade?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mon logbook</h1>
        <button className="btn-icon" onClick={onAdd} aria-label="Ajouter une ascension">＋</button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Rechercher une voie, un site…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {TYPE_FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🧗</p>
          <p className="empty-title">Aucune ascension ici.</p>
          <p className="empty-sub">
            {ascents.length === 0 ? "Enregistre ta première voie pour commencer." : "Essaie un autre filtre."}
          </p>
          {ascents.length === 0 && <button className="btn-primary" onClick={onAdd}>Ajouter une ascension</button>}
        </div>
      ) : (
        <div className="ascents-list">
          {filtered.map((a) => (
            <AscentCard key={a.id} ascent={a} gyms={gyms} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
