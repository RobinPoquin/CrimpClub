import { useState, useRef, useEffect } from "react";
import InlineGymCreator from "./InlineGymCreator";

// Champ de saisie avec autocomplétion sur les lieux mémorisés
export default function LocationInput({ value, onChange, locations = [], placeholder, userId, gyms = [], onGymCreated, showCreateGym = false, isOutdoor = false }) {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState(value || "");
  const [creating, setCreating] = useState(false); // Affiche le mini-formulaire
  const wrapRef                 = useRef(null);

  // Filtre les lieux selon la saisie
  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  // Ferme la liste si clic en dehors
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  function handleGymCreated(gym) {
    // Pré-sélectionne la salle créée
    setQuery(gym.name);
    onChange(gym.name);
    setCreating(false);
    setOpen(false);
    if (onGymCreated) onGymCreated(gym);
  }

  return (
    <div className="location-input-wrap" ref={wrapRef}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "ex. Arkose Nation"}
      />

      {/* Liste de suggestions */}
      {open && !creating && (
        <ul className="location-suggestions">
          {filtered.map(l => (
            <li key={l.id}>
              <button type="button" className="location-suggestion-btn"
                onClick={() => handleSelect(l.name)}>
                <span>{l.is_outdoor ? "🌿" : "🏟️"}</span>
                <span>{l.name}</span>
              </button>
            </li>
          ))}
          {/* Bouton créer salle ou spot si extérieur */}
          {showCreateGym && (
            <li>
              <button type="button" className="location-suggestion-btn location-create-btn"
                onClick={() => { setCreating(true); setOpen(false); }}>
                <span>➕</span>
                <span>{isOutdoor ? "Créer un nouveau spot" : "Créer une nouvelle salle"}</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Mini-formulaire inline */}
      {creating && (
        <div className="location-suggestions location-creator-wrap">
          <InlineGymCreator
            userId={userId}
            onCreated={handleGymCreated}
            onCancel={() => setCreating(false)}
            isOutdoor={isOutdoor}
          />
        </div>
      )}
    </div>
  );
}