// =============================================
// COMPOSANT : Mesures en Temps Réel
// ─── Rôle : orchestrateur + layout sidebar ───
//
// Sections (composants séparés) :
//   DebutFinDeCourse.jsx  ← implémenté
//   RoueCodeuse.jsx       ← implémenté
//   CycleArrosage.jsx     ← implémenté
//   (Alerte.jsx           ← à venir)
// =============================================

import { useState } from "react";
import "../styles/MesuresTempsReel.css";
import CycleArrosage from "./CycleArrosage";
import DebutFinDeCourse from "./DebutFinDeCourse";
import RoueCodeuse from "./RoueCodeuse";

// ─── Définition des sections du menu ─────────
const SECTIONS = [
  { id: "debut-fin", label: "Début et Fin de course" },
  { id: "roue-codeuse", label: "Roue Codeuse" },
  { id: "cycle-arrosage", label: "Cycle d'arrosage" },
  { id: "alerte", label: "Alerte" },
];

const TITRES = {
  "debut-fin": "Début et Fin de course",
  "roue-codeuse": "Roue Codeuse",
  "cycle-arrosage": "Cycle d'arrosage",
  alerte: "Alerte",
};

const MesuresTempsReel = ({ surChangementPage }) => {
  const [sectionActive, setSectionActive] = useState("debut-fin");

  // ─── Rendu de la section active ──────────────
  const rendreSection = () => {
    switch (sectionActive) {
      case "debut-fin":
        return <DebutFinDeCourse />;
      case "roue-codeuse":
        return <RoueCodeuse />;
      case "cycle-arrosage":
        return <CycleArrosage />;
      default:
        return (
          <div className="mesures__placeholder">
            🚧 Section « {TITRES[sectionActive]} » — à venir
          </div>
        );
    }
  };

  return (
    <div className="mesures">
      {/* ── Barre latérale ── */}
      <aside className="mesures__sidebar">
        <h2 className="mesures__sidebar-titre">Tableau de Bord</h2>

        <nav className="mesures__sidebar-liste">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`mesures__sidebar-bouton ${
                sectionActive === section.id
                  ? "mesures__sidebar-bouton--actif"
                  : ""
              }`}
              onClick={() => setSectionActive(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <button
          className="mesures__sidebar-retour"
          onClick={() => surChangementPage("accueil")}
        >
          ← Accueil
        </button>
      </aside>

      {/* ── Contenu de la section active ── */}
      <div className="mesures__contenu">
        <h2 className="mesures__section-titre">{TITRES[sectionActive]}</h2>
        <div className="mesures__section-corps">{rendreSection()}</div>
      </div>
    </div>
  );
};

export default MesuresTempsReel;
