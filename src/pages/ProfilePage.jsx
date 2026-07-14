export default function ProfilePage({ user, ascents, gyms = [], spots = [], onSignOut, onOpenGyms, onOpenSettings, onOpenSpots }) {
  const initials = user.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const outdoor = ascents.filter((a) => a.outdoor).length;
  const sites = new Set(ascents.map((a) => a.location).filter(Boolean)).size;

  function exportData() {
    const json = JSON.stringify(ascents, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climblog_export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <button className="setting-row" onClick={exportData}>
          <span>⬇️ Exporter mes données</span>
          <span className="chevron">›</span>
        </button>
        <div className="setting-row setting-info">
          <span>📧 Email</span>
          <span className="setting-val">{user.email}</span>
        </div>
        <div className="setting-row setting-info">
          <span>🗓️ Membre depuis</span>
          <span className="setting-val">
            {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
        </div>
        <button className="setting-row setting-danger" onClick={onSignOut}>
          <span>🚪 Se déconnecter</span>
        </button>
      </div>

      <div className="version-note">CrimpClub v1.0</div>
    </div>
  );
}
