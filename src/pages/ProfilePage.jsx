import { canAccessSimcomp } from "../lib/simcomp";

export default function ProfilePage({ user, ascents, gyms = [], spots = [], onSignOut, onOpenGyms, onOpenSettings, onOpenSpots, onOpenSimcomp }) {
  const initials = user.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const outdoor = ascents.filter((a) => a.outdoor).length;
  const sites = new Set(ascents.map((a) => a.location).filter(Boolean)).size;

  return (
    <div className="page">
      <div className="page-header"><h1>Mon profil</h1></div>

      <div className="profile-hero">
        <div className="avatar">{user.avatarUrl
          ? <img src={user.avatarUrl} alt="Avatar" className="avatar avatar-img" />
          : <div className="avatar">{initials}</div>
        }</div>
        <div>
          <h2 className="profile-name">{user.displayName || "Grimpeur"}</h2>
          <p className="profile-email">{user.email}</p>
          {/* Bio — affichée seulement si renseignée */}
          {user.bio && <p className="profile-bio">{user.bio}</p>}
        </div>
      </div>

      <div className="profile-stats">
        <div className="pstat">
          <span className="pstat-val">{ascents.length}</span>
          <span className="pstat-label">Ascensions</span>
        </div>
        <div className="pstat">
          <span className="pstat-val">{outdoor}</span>
          <span className="pstat-label">En extérieur</span>
        </div>
        <div className="pstat">
          <span className="pstat-val">{sites}</span>
          <span className="pstat-label">Sites</span>
        </div>
      </div>

      {/* Aperçu des 3 dernières ascensions */}
      {ascents.length > 0 && (
        <div className="profile-recent">
          <h3 className="profile-section-title">Dernières ascensions</h3>
          <div className="profile-recent-list">
            {ascents.slice(0, 3).map(a => (
              <div key={a.id} className="profile-recent-item">
                {/* Pastille couleur pour les blocs couleur, cotation sinon */}
                <div className="profile-recent-grade">
                  {a.colorHex
                    ? <span className="profile-recent-dot" style={{ background: a.colorHex }} />
                    : <span className="profile-recent-text">{a.grade}</span>
                  }
                </div>
                <div className="profile-recent-info">
                  {/* Nom de la voie ou type si pas de nom */}
                  <span className="profile-recent-name">
                    {a.routeName || (a.colorName ? a.colorName : a.type)}
                  </span>
                  <span className="profile-recent-meta">
                    {a.location} · {a.date ? new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}
                  </span>
                </div>
                {/* Badge résultat */}
                <span className={`card-result ${a.result === "Flash" ? "result-flash" : "result-worked"}`}>
                  {a.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="settings-list">
        <button className="setting-row" onClick={onOpenSettings}>
          <span>⚙️ Paramètres du compte</span>
          <span className="chevron">›</span>
        </button>
        <button className="setting-row" onClick={onOpenGyms}>
          <span>🏟️ Mes salles &amp; couleurs</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="setting-val">{gyms.length} salle{gyms.length !== 1 ? "s" : ""}</span>
            <span className="chevron">›</span>
          </div>
        </button>
        <button className="setting-row" onClick={onOpenSpots}>
          <span>🌿 Mes spots extérieurs</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="setting-val">{spots.length} spot{spots.length !== 1 ? "s" : ""}</span>
            <span className="chevron">›</span>
          </div>
        </button>
        <div className="setting-row setting-info">
          <span>🗓️ Membre depuis</span>
          <span className="setting-val">
            {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
        </div>
        {canAccessSimcomp(user.id) && (
          <button className="setting-row" onClick={onOpenSimcomp}>
            <span>🏆 SimComp</span>
            <span className="chevron">›</span>
          </button>
        )}
        <button className="setting-row setting-danger" onClick={onSignOut}>
          <span>🚪 Se déconnecter</span>
        </button>
      </div>

      <div className="version-note">CrimpClub v1.0</div>
    </div>
  );
}
