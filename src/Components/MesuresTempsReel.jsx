// =============================================
// COMPOSANT : Mesures en Temps Réel
// Rôle : orchestrateur + layout sidebar
// Sections : DebutFinDeCourse · RoueCodeuse · CycleArrosage · Alerte
// =============================================

import { useState } from "react";
import "../styles/MesuresTempsReel.css";
import Alerte from "./Alerte";
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

  // ─── Données partagées : remontées depuis chaque capteur ──
  const [donneesCapteurs, setDonneesCapteurs] = useState({
    debutFinCourse: { position: 0, vitesse: 0 },
    roueCodueuse: { rpm: 0 },
    cycleArrosage: { electrovanne: "fermee" },
  });

  const majDonneesCapteur = (idCapteur, nouvelles) => {
    setDonneesCapteurs((prev) => ({
      ...prev,
      [idCapteur]: { ...prev[idCapteur], ...nouvelles },
    }));
  };

  // ─── Rendu de la section active ──────────────
  const rendreSection = () => {
    switch (sectionActive) {
      case "debut-fin":
        return (
          <DebutFinDeCourse
            onDonnees={(d) => majDonneesCapteur("debutFinCourse", d)}
          />
        );
      case "roue-codeuse":
        return (
          <RoueCodeuse
            onDonnees={(d) => majDonneesCapteur("roueCodueuse", d)}
          />
        );
      case "cycle-arrosage":
        return (
          <CycleArrosage
            onDonnees={(d) => majDonneesCapteur("cycleArrosage", d)}
          />
        );
      case "alerte":
        return <Alerte donneesCapteurs={donneesCapteurs} />;
      default:
        return (
          <div className="mesures__placeholder">
            Section {TITRES[sectionActive]} — à venir
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
