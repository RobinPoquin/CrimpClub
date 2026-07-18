import { useState, useRef, useEffect } from "react";

// Champ de saisie avec autocomplétion sur les secteurs mémorisés du spot
export default function SectorInput({ value, onChange, sectors = [], placeholder }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef           = useRef(null);

  // Filtre les secteurs selon la saisie
  const filtered = sectors.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  // Ferme la liste si clic en dehors
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
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

  return (
    <div className="location-input-wrap" ref={wrapRef}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "ex. Escalès"}
      />

      {/* Liste des secteurs connus pour ce spot */}
      {open && filtered.length > 0 && (
        <ul className="location-suggestions">
          {filtered.map(s => (
            <li key={s.id}>
              <button type="button" className="location-suggestion-btn"
                onClick={() => handleSelect(s.name)}>
                <span>📌</span>
                <span>{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}