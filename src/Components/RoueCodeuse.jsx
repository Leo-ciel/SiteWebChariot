// =============================================
// COMPOSANT : Roue Codeuse (Encodeur)
// =============================================
// Affiche :
//   - 4 indicateurs (début 0°, fin 360°, position °, vitesse RPM)
//   - Roue SVG animée avec capteur SICK
//   - Jauges RPM et position angulaire
//   - Stats (angle cumulé, tours effectués)
//   - Boutons (changer le sens, remise à zéro)
//   - Tableau historique des événements
// =============================================

import { useEffect, useRef, useState } from "react";
import "../styles/RoueCodeuse.css";
import TableauHistorique from "./TableauHistorique";

const heureActuelle = () => new Date().toLocaleTimeString("fr-FR");

// ─── Historique initial simulé ───────────────
const HISTORIQUE_INITIAL = [
  {
    id: 1,
    heure: "08:10:05",
    evenement: "Démarrage encodeur — position 0°",
    statut: "ok",
  },
  {
    id: 2,
    heure: "08:10:48",
    evenement: "Tour complet détecté (360°)",
    statut: "ok",
  },
  {
    id: 3,
    heure: "09:05:22",
    evenement: "500 impulsions comptées",
    statut: "ok",
  },
  {
    id: 4,
    heure: "10:12:37",
    evenement: "Vitesse max dépassée — 320 RPM",
    statut: "alerte",
  },
  {
    id: 5,
    heure: "11:44:01",
    evenement: "Réinitialisation position à 0°",
    statut: "ok",
  },
];

const RoueCodeuse = () => {
  // ─── États ───────────────────────────────────
  const [angleDegres, setAngleDegres] = useState(0); // angle cumulé en °
  const [angleAffiche, setAngleAffiche] = useState(0); // modulo 360 pour l'affichage
  const [rpm, setRpm] = useState(45); // tours par minute
  const [impulsions, setImpulsions] = useState(1024); // impulsions totales
  const [sens, setSens] = useState("horaire"); // sens de rotation
  const [rotationVisuelle, setRotationVisuelle] = useState(0); // rotation SVG cumulée
  const [historique, setHistorique] = useState(HISTORIQUE_INITIAL);

  // ─── Simulation en temps réel toutes les 300ms ─
  useEffect(() => {
    const intervalle = setInterval(() => {
      const delta = (rpm / 60) * (360 / 1000) * 300;
      const increment = sens === "horaire" ? delta : -delta;

      setRotationVisuelle((prev) => prev + increment);
      setAngleDegres((prev) => parseFloat((prev + increment).toFixed(1)));
      setAngleAffiche((prev) => {
        const nouvelle = (((prev + increment) % 360) + 360) % 360;
        return parseFloat(nouvelle.toFixed(1));
      });
      setImpulsions((prev) => prev + Math.floor(Math.random() * 3 + 1));
      setRpm((prev) => {
        const nouveau = prev + (Math.random() * 6 - 3);
        return Math.min(300, Math.max(10, parseFloat(nouveau.toFixed(0))));
      });
    }, 300);

    return () => clearInterval(intervalle);
  }, [rpm, sens]);

  // ─── Alerte si RPM critique ───────────────────
  const dernierAlerteRpm = useRef(null);

  useEffect(() => {
    if (rpm > 280 && dernierAlerteRpm.current !== rpm) {
      dernierAlerteRpm.current = rpm;
      setTimeout(() => {
        setHistorique((prev) => [
          {
            id: prev.length + 1,
            heure: heureActuelle(),
            evenement: `Vitesse critique — ${rpm} RPM`,
            statut: "alerte",
          },
          ...prev.slice(0, 9),
        ]);
      }, 0);
    } else if (rpm <= 280) {
      dernierAlerteRpm.current = null;
    }
  }, [rpm]);

  // ─── Basculer le sens de rotation ────────────
  const basculerSens = () => {
    const nouveauSens = sens === "horaire" ? "antihoraire" : "horaire";
    setSens(nouveauSens);
    setHistorique((prev) => [
      {
        id: prev.length + 1,
        heure: heureActuelle(),
        evenement: `Changement de sens → ${nouveauSens}`,
        statut: "ok",
      },
      ...prev.slice(0, 9),
    ]);
  };

  // ─── Remise à zéro des compteurs ─────────────
  const remettreAZero = () => {
    setAngleDegres(0);
    setAngleAffiche(0);
    setImpulsions(0);
    setHistorique((prev) => [
      {
        id: prev.length + 1,
        heure: heureActuelle(),
        evenement: "Réinitialisation position à 0°",
        statut: "ok",
      },
      ...prev.slice(0, 9),
    ]);
  };

  // ─── Classe couleur RPM ───────────────────────
  const classeRpm =
    rpm > 200
      ? "mesures__indicateur-valeur--rouge"
      : rpm > 120
        ? "mesures__indicateur-valeur--orange"
        : "mesures__indicateur-valeur--vert";

  // ─── Rendu ───────────────────────────────────
  return (
    <>
      {/* ── 4 Indicateurs ── */}
      <div className="mesures__indicateurs">
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Début</span>
          <span className="mesures__indicateur-valeur">0°</span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Fin</span>
          <span className="mesures__indicateur-valeur">360°</span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Position °</span>
          <span className="mesures__indicateur-valeur mesures__indicateur-valeur--bleu">
            {angleAffiche}°
          </span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Vitesse RPM</span>
          <span className={`mesures__indicateur-valeur ${classeRpm}`}>
            {rpm} RPM
          </span>
        </div>
      </div>

      {/* ── Panneau position (roue visuelle + jauges) ── */}
      <div className="mesures__panneau">
        <div className="mesures__panneau-titre">
          <span className="mesures__live-dot" />
          Position sur la course
        </div>
        <div className="mesures__panneau-corps">
          <div className="roue__conteneur">
            {/* Roue SVG animée */}
            <div className="roue__visuel-wrapper">
              <svg
                className="roue__svg"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Corps de la roue */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="#e8e8e8"
                  stroke="#bbb"
                  strokeWidth="3"
                />

                {/* Groupe rotatif */}
                <g transform={`rotate(${rotationVisuelle}, 100, 100)`}>
                  {/* 24 encoches périphériques */}
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 360) / 24;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 100 + 72 * Math.cos(rad);
                    const y1 = 100 + 72 * Math.sin(rad);
                    const x2 = 100 + 86 * Math.cos(rad);
                    const y2 = 100 + 86 * Math.sin(rad);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#555"
                        strokeWidth={i % 6 === 0 ? "3" : "1.5"}
                      />
                    );
                  })}

                  {/* Cercle intérieur blanc */}
                  <circle
                    cx="100"
                    cy="100"
                    r="58"
                    fill="white"
                    stroke="#ccc"
                    strokeWidth="2"
                  />

                  {/* Trait de référence central (comme sur la photo) */}
                  <line
                    x1="100"
                    y1="55"
                    x2="100"
                    y2="78"
                    stroke="#333"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* 3 vis cruciformes (comme sur la vraie roue) */}
                  {[0, 120, 240].map((a) => {
                    const rad = (a * Math.PI) / 180;
                    const bx = 100 + 40 * Math.cos(rad);
                    const by = 100 + 40 * Math.sin(rad);
                    return (
                      <g key={a}>
                        <circle
                          cx={bx}
                          cy={by}
                          r="7"
                          fill="#ddd"
                          stroke="#aaa"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={bx - 4}
                          y1={by}
                          x2={bx + 4}
                          y2={by}
                          stroke="#888"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={bx}
                          y1={by - 4}
                          x2={bx}
                          y2={by + 4}
                          stroke="#888"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}

                  {/* Axe central */}
                  <circle
                    cx="100"
                    cy="100"
                    r="10"
                    fill="#999"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <circle cx="100" cy="100" r="4" fill="#555" />
                </g>

                {/* Capteur SICK (fixe — ne tourne pas) */}
                <rect
                  x="86"
                  y="8"
                  width="28"
                  height="18"
                  rx="4"
                  fill="#2196f3"
                  stroke="#1565c0"
                  strokeWidth="1.5"
                />
                <text
                  x="100"
                  y="21"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="Nunito"
                >
                  SICK
                </text>

                {/* Flèche sens de rotation */}
                <text
                  x="100"
                  y="190"
                  textAnchor="middle"
                  fill="#555"
                  fontSize="11"
                  fontFamily="Nunito"
                  fontWeight="700"
                >
                  {sens === "horaire" ? "↻ Horaire" : "↺ Anti-horaire"}
                </text>
              </svg>

              {/* Compteur d'impulsions */}
              <div className="roue__impulsions">
                <span className="roue__impulsions-label">
                  Impulsions totales
                </span>
                <span className="roue__impulsions-valeur">
                  {impulsions.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Jauges latérales */}
            <div className="roue__jauges">
              {/* Jauge RPM */}
              <div className="roue__jauge">
                <div className="roue__jauge-titre">Vitesse (RPM)</div>
                <div className="roue__jauge-fond">
                  <div
                    className={`roue__jauge-remplissage ${
                      rpm > 200
                        ? "roue__jauge-remplissage--rouge"
                        : rpm > 120
                          ? "roue__jauge-remplissage--orange"
                          : "roue__jauge-remplissage--vert"
                    }`}
                    style={{ width: `${Math.min((rpm / 300) * 100, 100)}%` }}
                  />
                </div>
                <div className="roue__jauge-etiquettes">
                  <span>0</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>

              {/* Jauge position angulaire */}
              <div className="roue__jauge">
                <div className="roue__jauge-titre">Position angulaire</div>
                <div className="roue__jauge-fond">
                  <div
                    className="roue__jauge-remplissage roue__jauge-remplissage--bleu"
                    style={{ width: `${(angleAffiche / 360) * 100}%` }}
                  />
                </div>
                <div className="roue__jauge-etiquettes">
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
              </div>

              {/* Stats */}
              <div className="roue__stat">
                <span className="roue__stat-label">Angle cumulé total</span>
                <span className="roue__stat-valeur">
                  {Math.abs(angleDegres).toFixed(1)}°
                </span>
              </div>
              <div className="roue__stat">
                <span className="roue__stat-label">Tours effectués</span>
                <span className="roue__stat-valeur">
                  {Math.abs(Math.floor(angleDegres / 360))}
                </span>
              </div>

              {/* Boutons de contrôle */}
              <div className="roue__controles">
                <button
                  className="roue__btn roue__btn--sens"
                  onClick={basculerSens}
                >
                  {sens === "horaire" ? "↺ Anti-horaire" : "↻ Horaire"}
                </button>
                <button
                  className="roue__btn roue__btn--reset"
                  onClick={remettreAZero}
                >
                  ↺ Remise à zéro
                </button>
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

export default RoueCodeuse;
