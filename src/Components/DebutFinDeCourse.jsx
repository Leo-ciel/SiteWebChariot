// =============================================
// COMPOSANT : Début et Fin de Course
// =============================================
// Affiche :
//   - 4 indicateurs (début, fin, position, vitesse)
//   - Barre de progression avec chariot animé
//   - Tableau historique des événements
// =============================================

import { useEffect, useRef, useState } from "react";
import "../styles/DebutFinDeCourse.css";
import TableauHistorique from "./TableauHistorique";

// Et ajoute cette fonction juste en dessous des imports :
const heureActuelle = () => new Date().toLocaleTimeString("fr-FR");

// ─── Historique initial simulé ───────────────
const HISTORIQUE_INITIAL = [
  {
    id: 1,
    heure: "08:14:02",
    evenement: "Départ depuis position 0",
    statut: "ok",
  },
  {
    id: 2,
    heure: "08:14:45",
    evenement: "Fin de course atteinte (100m)",
    statut: "ok",
  },
  {
    id: 3,
    heure: "09:02:11",
    evenement: "Retour position initiale",
    statut: "ok",
  },
  {
    id: 4,
    heure: "10:30:55",
    evenement: "Vitesse hors plage détectée",
    statut: "alerte",
  },
  {
    id: 5,
    heure: "11:18:33",
    evenement: "Trajet terminé normalement",
    statut: "ok",
  },
];

const DebutFinDeCourse = () => {
  // ─── États ───────────────────────────────────
  const [position, setPosition] = useState(34); // position en %
  const [vitesse, setVitesse] = useState(1.8); // m/s
  const debut = "0 m";
  const fin = "100 m";
  const [historique, setHistorique] = useState(HISTORIQUE_INITIAL);

  // ─── Simulation en temps réel toutes les 2s ──
  useEffect(() => {
    const intervalle = setInterval(() => {
      setPosition((prev) => {
        const nouvelle = prev + (Math.random() * 4 - 2);
        return Math.min(100, Math.max(0, Math.round(nouvelle)));
      });
      setVitesse((prev) => {
        const nouvelle = prev + (Math.random() * 0.4 - 0.2);
        return Math.min(5, Math.max(0, parseFloat(nouvelle.toFixed(1))));
      });
    }, 2000);

    return () => clearInterval(intervalle);
  }, []);

  // ─── Gestion des événements aux bornes ─────────────────
  const dernierEvenement = useRef(null);

  useEffect(() => {
    // Position >= 98 : fin de course
    if (position >= 98 && dernierEvenement.current !== "fin") {
      dernierEvenement.current = "fin";
      setTimeout(() => {
        setHistorique((prev) => [
          {
            id: prev.length + 1,
            heure: heureActuelle(),
            evenement: "Fin de course atteinte",
            statut: "ok",
          },
          ...prev.slice(0, 9),
        ]);
      }, 0);
    }
    // Position <= 2 : début de course
    else if (position <= 2 && dernierEvenement.current !== "debut") {
      dernierEvenement.current = "debut";
      setTimeout(() => {
        setHistorique((prev) => [
          {
            id: prev.length + 1,
            heure: heureActuelle(),
            evenement: "Début de course atteint",
            statut: "ok",
          },
          ...prev.slice(0, 9),
        ]);
      }, 0);
    }
    // Zone neutre : réinitialiser
    else if (position > 2 && position < 98) {
      dernierEvenement.current = null;
    }
  }, [position]);

  const positionMetres = `${position} m`;
  const positionChariot = `calc(${position}% - 16px)`;

  // ─── Rendu ───────────────────────────────────
  return (
    <>
      {/* ── 4 Indicateurs ── */}
      <div className="mesures__indicateurs">
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Début</span>
          <span className="mesures__indicateur-valeur">{debut}</span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Fin</span>
          <span className="mesures__indicateur-valeur">{fin}</span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Position</span>
          <span className="mesures__indicateur-valeur mesures__indicateur-valeur--bleu">
            {positionMetres}
          </span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Vitesse</span>
          <span
            className={`mesures__indicateur-valeur ${
              vitesse > 3
                ? "mesures__indicateur-valeur--rouge"
                : "mesures__indicateur-valeur--vert"
            }`}
          >
            {vitesse} m/s
          </span>
        </div>
      </div>

      {/* ── Panneau position sur la course ── */}
      <div className="mesures__panneau">
        <div className="mesures__panneau-titre">
          <span className="mesures__live-dot" />
          Position sur la course
        </div>
        <div className="mesures__panneau-corps">
          <div className="dfc__barre-wrapper">
            {/* Barre de progression */}
            <div className="dfc__barre-fond">
              <div
                className="dfc__barre-progression"
                style={{ width: `${position}%` }}
              >
                {position > 12 && (
                  <span className="dfc__barre-pourcent">{position}%</span>
                )}
              </div>
            </div>

            <div className="dfc__barre-etiquettes">
              <span>0 m — Début</span>
              <span>Fin — 100 m</span>
            </div>

            {/* Piste avec chariot animé */}
            <div className="dfc__piste">
              <div className="dfc__rail" />
              <div
                className="dfc__chariot"
                style={{ left: positionChariot }}
                title={`Position : ${positionMetres}`}
              >
                🚜
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau historique ── */}
      <TableauHistorique historique={historique} />
    </>
  );
};

export default DebutFinDeCourse;
