import { useState } from "react";

// Tags prédéfinis suggérés à l'utilisateur
const SUGGESTED_TAGS = [
  "Dalle", "Dévers", "Dièdre", "Fissure", "Toit",
  "Dynamique", "Statique", "Force", "Technique", "Endurance",
  "Mental", "Réglettes", "Colonnettes", "Pinces",
];

// Composant de saisie de tags libres avec suggestions
export default function TagInput({ tags = [], onChange }) {
  const [input, setInput] = useState("");

  // Ajoute un tag s'il n'existe pas déjà
  function addTag(tag) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setInput("");
  }

  // Supprime un tag par son index
  function removeTag(idx) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  // Ajoute le tag quand l'user appuie sur Entrée ou virgule
  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    // Supprime le dernier tag avec Backspace si le champ est vide
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  // Suggestions filtrées selon la saisie et non déjà sélectionnées
  const suggestions = SUGGESTED_TAGS.filter(t =>
    t.toLowerCase().includes(input.toLowerCase()) &&
    !tags.includes(t)
  );

  return (
    <div className="tag-input-wrap">
      {/* Tags déjà ajoutés */}
      <div className="tag-list">
        {tags.map((tag, idx) => (
          <span key={idx} className="tag-item">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(idx)}
              aria-label={`Supprimer ${tag}`}
            >✕</button>
          </span>
        ))}

        {/* Champ de saisie inline */}
        <input
          type="text"
          className="tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? "Dalle, Dévers, Force…" : ""}
        />
      </div>

      {/* Suggestions rapides */}
      {suggestions.length > 0 && input.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.slice(0, 5).map(s => (
            <button
              key={s}
              type="button"
              className="tag-suggestion-btn"
              onClick={() => addTag(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Tags suggérés quand le champ est vide */}
      {input.length === 0 && (
        <div className="tag-suggestions">
            {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(s => (
            <button
              key={s}
              type="button"
              className="tag-suggestion-btn"
              onClick={() => addTag(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}