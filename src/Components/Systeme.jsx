// =============================================
// COMPOSANT : Système
// Layout avec sidebar — même style que MesuresTempsReel
// Sections : Gestion des profils · Changer de compte
// =============================================

import { useState } from "react";
import "../styles/Systeme.css";
import GestionProfils from "./GestionProfils";

// ─── Sections disponibles ─────────────────────
const SECTIONS = [
  { id: "gestion-profils", label: "Gestion des profils" },
  { id: "changer-compte", label: "Changer de compte" },
];

const TITRES = {
  "gestion-profils": "Gestion des profils",
  "changer-compte": "Changer de compte",
};

const Systeme = ({
  surChangementPage,
  comptes,
  surAjoutCompte,
  surSuppressionCompte,
  surModificationCompte,
  utilisateurConnecte,
}) => {
  const [sectionActive, setSectionActive] = useState("gestion-profils");

  // ─── Rendu de la section active ──────────────
  const rendreSection = () => {
    switch (sectionActive) {
      case "gestion-profils":
        return (
          <GestionProfils
            comptes={comptes}
            surAjoutCompte={surAjoutCompte}
            surSuppressionCompte={surSuppressionCompte}
            surModificationCompte={surModificationCompte}
          />
        );
      case "changer-compte":
        return (
          <div className="systeme__changer-compte">
            <p className="systeme__changer-sous-titre">
              Sélectionnez le type de compte pour vous reconnecter
            </p>
            <div className="systeme__changer-cartes">
              <button
                className="systeme__changer-carte"
                onClick={() => surChangementPage("connexion", null)}
              >
                <span className="systeme__changer-icone">👤</span>
                <span className="systeme__changer-label">Utilisateur</span>
              </button>
              <button
                className="systeme__changer-carte systeme__changer-carte--admin"
                onClick={() => surChangementPage("connexion", null)}
              >
                <span className="systeme__changer-icone">🔑</span>
                <span className="systeme__changer-label">Administrateur</span>
              </button>
            </div>
            {utilisateurConnecte && (
              <p className="systeme__changer-info">
                Connecté en tant que :{" "}
                <strong>{utilisateurConnecte.email}</strong>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="systeme">
      {/* ── Sidebar ── */}
      <aside className="systeme__sidebar">
        <h2 className="systeme__sidebar-titre">Système</h2>

        <nav className="systeme__sidebar-liste">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`systeme__sidebar-bouton ${
                sectionActive === section.id
                  ? "systeme__sidebar-bouton--actif"
                  : ""
              }`}
              onClick={() => setSectionActive(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="systeme__sidebar-bas">
          <button
            className="systeme__sidebar-deconnexion"
            onClick={() => surChangementPage("connexion")}
          >
            ⏻ Déconnexion
          </button>
          <button
            className="systeme__sidebar-retour"
            onClick={() => surChangementPage("accueil")}
          >
            ← Accueil
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <div className="systeme__contenu">
        <h2 className="systeme__section-titre">{TITRES[sectionActive]}</h2>
        <div className="systeme__section-corps">{rendreSection()}</div>
      </div>
    </div>
  );
};

export default Systeme;
