// =============================================
// COMPOSANT : Cycle d'arrosage
// =============================================
// Fonctionnalités :
//   - Basculer Mode Auto / Manuel
//   - Ouvrir / Fermer l'électrovanne
//   - Voir la position sur la course (%)
//   - Voir les cycles d'arrosage en cours / passés
//   - Créer un nouveau cycle (vitesse, durée, nb passages)
//   - Historique des événements
// =============================================

import { useEffect, useState } from "react";
import "../styles/CycleArrosage.css";
import TableauHistorique from "./TableauHistorique";

// ─── Utilitaire heure ─────────────────────────
const heureActuelle = () => new Date().toLocaleTimeString("fr-FR");

// ─── Historique initial ───────────────────────
const HISTORIQUE_INITIAL = [
  {
    id: 1,
    heure: "07:30:00",
    evenement: "Démarrage cycle automatique matin",
    statut: "ok",
  },
  { id: 2, heure: "07:30:45", evenement: "Électrovanne ouverte", statut: "ok" },
  {
    id: 3,
    heure: "07:45:10",
    evenement: "Cycle terminé — 1 passage complet",
    statut: "ok",
  },
  {
    id: 4,
    heure: "09:00:00",
    evenement: "Pression insuffisante détectée",
    statut: "alerte",
  },
  {
    id: 5,
    heure: "11:20:30",
    evenement: "Cycle manuel lancé — V2 intermédiaire",
    statut: "ok",
  },
];

// ─── Cycles simulés initiaux ──────────────────
const CYCLES_INITIAUX = [
  {
    id: 1,
    heure: "07:30:00",
    vitesse: "V1 — Petite",
    passages: 2,
    duree: "15 min",
    statut: "ok",
  },
  {
    id: 2,
    heure: "11:20:30",
    vitesse: "V2 — Interméd.",
    passages: 1,
    duree: "8 min",
    statut: "ok",
  },
];

// ─── Schéma SVG de l'électrovanne ────────────
const SchemaElectrovanne = ({ ouverte }) => (
  <svg
    className="arrosage__schema-svg"
    viewBox="0 0 280 160"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Réservoir / corps principal */}
    <rect
      x="80"
      y="30"
      width="70"
      height="90"
      rx="8"
      fill="#2a2a2a"
      stroke="#555"
      strokeWidth="2"
    />

    {/* Tuyau entrée gauche */}
    <rect
      x="10"
      y="68"
      width="70"
      height="24"
      rx="4"
      fill="#666"
      stroke="#444"
      strokeWidth="1.5"
    />
    <circle cx="10" cy="80" r="8" fill="#888" stroke="#555" strokeWidth="1.5" />

    {/* Tuyau sortie droite */}
    <rect
      x="150"
      y="68"
      width="80"
      height="24"
      rx="4"
      fill={ouverte ? "#4caf50" : "#e53935"}
      stroke={ouverte ? "#2e7d32" : "#b71c1c"}
      strokeWidth="1.5"
      style={{ transition: "fill 0.4s ease" }}
    />

    {/* Vanne (clapet) */}
    {ouverte ? (
      // Vanne ouverte = passage libre
      <rect
        x="148"
        y="68"
        width="6"
        height="24"
        rx="2"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="1"
      />
    ) : (
      // Vanne fermée = clapet bloquant
      <rect
        x="148"
        y="64"
        width="6"
        height="32"
        rx="2"
        fill="#e53935"
        stroke="#b71c1c"
        strokeWidth="1.5"
      />
    )}

    {/* Bobine électrique (solénoïde) */}
    <rect
      x="95"
      y="8"
      width="40"
      height="28"
      rx="5"
      fill={ouverte ? "#1565c0" : "#555"}
      stroke={ouverte ? "#0d47a1" : "#333"}
      strokeWidth="1.5"
      style={{ transition: "fill 0.4s ease" }}
    />
    <text
      x="115"
      y="26"
      textAnchor="middle"
      fill="white"
      fontSize="7"
      fontWeight="bold"
      fontFamily="Nunito"
    >
      SOLÉNOÏDE
    </text>

    {/* Tige de commande */}
    <line
      x1="115"
      y1="36"
      x2="115"
      y2="50"
      stroke={ouverte ? "#1565c0" : "#888"}
      strokeWidth="3"
      style={{ transition: "stroke 0.4s ease" }}
    />

    {/* Écrou de liaison */}
    <circle
      cx="115"
      cy="52"
      r="6"
      fill={ouverte ? "#42a5f5" : "#777"}
      stroke="#333"
      strokeWidth="1.5"
      style={{ transition: "fill 0.4s ease" }}
    />

    {/* Tuyau flexible (gris argenté comme sur la photo) */}
    <path
      d="M 230 80 Q 255 60 260 80 Q 255 100 270 95"
      fill="none"
      stroke="#aaa"
      strokeWidth="8"
      strokeLinecap="round"
    />

    {/* Indicateur flux (flèche) */}
    {ouverte && (
      <g>
        <line
          x1="175"
          y1="80"
          x2="215"
          y2="80"
          stroke="#4caf50"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <polygon points="215,75 225,80 215,85" fill="#4caf50" />
      </g>
    )}

    {/* Label état */}
    <text
      x="115"
      y="145"
      textAnchor="middle"
      fill={ouverte ? "#2e7d32" : "#c62828"}
      fontSize="11"
      fontWeight="bold"
      fontFamily="Nunito"
      style={{ transition: "fill 0.4s ease" }}
    >
      {ouverte ? "● FLUX ACTIF" : "■ FLUX BLOQUÉ"}
    </text>
  </svg>
);

// ─── Composant principal ─────────────────────
const CycleArrosage = () => {
  // ─── États ───────────────────────────────────
  const [modeAuto, setModeAuto] = useState(false);
  const [electrovanneOuverte, setElectrovanneOuverte] = useState(false);
  const [position, setPosition] = useState(22); // % sur la course
  const [vitesseMMin, setVitesseMMin] = useState(12.4); // m/min
  const debut = "0 %";
  const fin = "100 %";
  const [cycles, setCycles] = useState(CYCLES_INITIAUX);
  const [cycleEnCours, setCycleEnCours] = useState(null);
  const [historique, setHistorique] = useState(HISTORIQUE_INITIAL);

  // ─── Formulaire Nouveau Cycle ─────────────────
  const [nvVitesse, setNvVitesse] = useState("V1");
  const [nvPassages, setNvPassages] = useState(1);
  const [nvDuree, setNvDuree] = useState(10);

  // ─── Simulation position en temps réel ───────
  // ⚠ terminerCycle() ne doit JAMAIS être appelé à l'intérieur
  // d'un setState updater (cause page blanche). On le sépare en 2 effets.
  useEffect(() => {
    if (!cycleEnCours) return;
    const intervalle = setInterval(() => {
      setPosition((prev) => {
        const nouvelle = prev + (Math.random() * 3 + 0.5);
        return parseFloat(Math.min(nouvelle, 99.9).toFixed(1));
      });
      setVitesseMMin((prev) => {
        const nouvelle = prev + (Math.random() * 2 - 1);
        return Math.min(40, Math.max(5, parseFloat(nouvelle.toFixed(1))));
      });
    }, 1500);
    return () => clearInterval(intervalle);
  }, [cycleEnCours]);

  // ─── Détection fin de course (séparé du setInterval) ─
  useEffect(() => {
    if (cycleEnCours && position >= 99.9) {
      terminerCycle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // ─── Ajouter un événement à l'historique ─────
  const ajouterEvenement = (evenement, statut = "ok") => {
    setHistorique((prev) => [
      { id: prev.length + 1, heure: heureActuelle(), evenement, statut },
      ...prev.slice(0, 9),
    ]);
  };

  // ─── Basculer Mode Auto / Manuel ─────────────
  const basculerMode = () => {
    const nouveau = !modeAuto;
    setModeAuto(nouveau);
    ajouterEvenement(`Mode basculé → ${nouveau ? "Automatique" : "Manuel"}`);
  };

  // ─── Ouvrir / Fermer l'électrovanne ──────────
  const basculerElectrovanne = () => {
    const nouvelEtat = !electrovanneOuverte;
    setElectrovanneOuverte(nouvelEtat);
    ajouterEvenement(`Électrovanne ${nouvelEtat ? "ouverte" : "fermée"}`);
  };

  // ─── Lancer un nouveau cycle ──────────────────
  const lancerCycle = () => {
    if (cycleEnCours) return;

    const nomVitesse = {
      V1: "V1 — Petite",
      V2: "V2 — Interméd.",
      V3: "V3 — Grande",
    }[nvVitesse];

    const nouveauCycle = {
      id: cycles.length + 1,
      heure: heureActuelle(),
      vitesse: nomVitesse,
      passages: nvPassages,
      duree: `${nvDuree} min`,
      statut: "cours",
    };

    setCycles((prev) => [nouveauCycle, ...prev]);
    setCycleEnCours(nouveauCycle.id);
    setElectrovanneOuverte(true);
    setPosition(0);
    ajouterEvenement(
      `Nouveau cycle lancé — ${nomVitesse}, ${nvPassages} passage(s), ${nvDuree} min`,
    );
  };

  // ─── Terminer le cycle en cours ───────────────
  const terminerCycle = () => {
    setCycleEnCours(null);
    setElectrovanneOuverte(false);
    setCycles((prev) =>
      prev.map((c) => (c.statut === "cours" ? { ...c, statut: "ok" } : c)),
    );
    ajouterEvenement("Cycle terminé — Électrovanne fermée automatiquement");
  };

  // ─── Arrêter le cycle manuellement ───────────
  const arreterCycle = () => {
    setCycleEnCours(null);
    setElectrovanneOuverte(false);
    setCycles((prev) =>
      prev.map((c) => (c.statut === "cours" ? { ...c, statut: "arrete" } : c)),
    );
    ajouterEvenement("Cycle interrompu manuellement", "alerte");
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <>
      {/* ── Ligne 1 : Mode + Électrovanne ── */}
      <div className="arrosage__actions">
        {/* Bouton Mode Auto / Manuel */}
        <button
          className={`arrosage__btn-mode ${
            modeAuto ? "arrosage__btn-mode--auto" : "arrosage__btn-mode--manuel"
          }`}
          onClick={basculerMode}
        >
          <span className="arrosage__btn-mode-label">Mode actuel</span>
          <span className="arrosage__btn-mode-valeur">
            {modeAuto ? "⚙ Automatique" : "✋ Manuel"}
          </span>
          <span className="arrosage__btn-mode-label" style={{ opacity: 0.6 }}>
            Cliquer pour changer
          </span>
        </button>

        {/* Bouton Ouvrir / Fermer Électrovanne */}
        <button
          className={`arrosage__btn-electrovanne ${
            electrovanneOuverte
              ? "arrosage__btn-electrovanne--ouverte"
              : "arrosage__btn-electrovanne--fermee"
          }`}
          onClick={basculerElectrovanne}
        >
          <span className="arrosage__btn-electrovanne-label">Électrovanne</span>
          <span className="arrosage__btn-electrovanne-valeur">
            {electrovanneOuverte
              ? "💧 Ouverte — Flux actif"
              : "🔒 Fermée — Flux bloqué"}
          </span>
          <span
            className="arrosage__btn-electrovanne-label"
            style={{ opacity: 0.7 }}
          >
            Cliquer pour {electrovanneOuverte ? "fermer" : "ouvrir"}
          </span>
        </button>
      </div>

      {/* ── Ligne 2 : 4 indicateurs ── */}
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
          <span className="mesures__indicateur-label">Position %</span>
          <span className="mesures__indicateur-valeur mesures__indicateur-valeur--bleu">
            {position} %
          </span>
        </div>
        <div className="mesures__indicateur">
          <span className="mesures__indicateur-label">Vitesse m/min</span>
          <span
            className={`mesures__indicateur-valeur ${
              cycleEnCours ? "mesures__indicateur-valeur--vert" : ""
            }`}
          >
            {cycleEnCours ? vitesseMMin : "—"} {cycleEnCours ? "m/min" : ""}
          </span>
        </div>
      </div>

      {/* ── Ligne 3 : Position sur la course + Cycles d'arrosage ── */}
      <div className="arrosage__grille">
        {/* Panneau Position sur la course */}
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">
            {cycleEnCours && <span className="mesures__live-dot" />}
            Position sur la course
          </div>
          <div className="mesures__panneau-corps">
            <div className="arrosage__schema-wrapper">
              {/* Schéma électrovanne SVG */}
              <SchemaElectrovanne ouverte={electrovanneOuverte} />
              <span
                className={`arrosage__schema-statut ${
                  electrovanneOuverte
                    ? "arrosage__schema-statut--ouvert"
                    : "arrosage__schema-statut--ferme"
                }`}
              >
                {electrovanneOuverte
                  ? "✓ Électrovanne ouverte"
                  : "✗ Électrovanne fermée"}
              </span>

              {/* Barre de progression */}
              <div style={{ width: "100%", marginTop: "12px" }}>
                <div className="arrosage__barre-fond">
                  <div
                    className="arrosage__barre-progression"
                    style={{ width: `${position}%` }}
                  >
                    {position > 15 && (
                      <span className="arrosage__barre-pourcent">
                        {position}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="arrosage__barre-etiquettes">
                  <span>0% — Début</span>
                  <span>Fin — 100%</span>
                </div>

                {/* Piste avec chariot */}
                <div className="arrosage__piste">
                  <div className="arrosage__rail" />
                  {electrovanneOuverte && (
                    <div
                      className="arrosage__gouttes"
                      style={{ left: `calc(${position}% - 10px)` }}
                    >
                      💧
                    </div>
                  )}
                  <div
                    className="arrosage__chariot"
                    style={{ left: `calc(${position}% - 14px)` }}
                  >
                    🚜
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau Cycles d'arrosage */}
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">Cycles d&apos;arrosage</div>
          <div className="mesures__panneau-corps">
            {cycles.length === 0 ? (
              <div
                className="mesures__placeholder"
                style={{ minHeight: "80px" }}
              >
                Aucun cycle enregistré
              </div>
            ) : (
              <div className="arrosage__cycles-liste">
                {cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className={`arrosage__cycle-item ${
                      cycle.statut === "cours"
                        ? "arrosage__cycle-item--en-cours"
                        : ""
                    }`}
                  >
                    <span className="arrosage__cycle-numero">#{cycle.id}</span>
                    <div className="arrosage__cycle-infos">
                      <span className="arrosage__cycle-titre">
                        {cycle.vitesse}
                      </span>
                      <span className="arrosage__cycle-detail">
                        {cycle.passages} passage(s) · {cycle.duree} ·{" "}
                        {cycle.heure}
                      </span>
                    </div>
                    <span
                      className={`arrosage__cycle-badge arrosage__cycle-badge--${cycle.statut}`}
                    >
                      {cycle.statut === "ok"
                        ? "✓ OK"
                        : cycle.statut === "cours"
                          ? "▶ En cours"
                          : "■ Arrêté"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ligne 4 : Nouveau Cycle + Historique ── */}
      <div className="arrosage__grille">
        {/* Panneau Nouveau Cycle */}
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">Nouveau Cycle</div>
          <div className="mesures__panneau-corps">
            {cycleEnCours ? (
              /* Cycle en cours → affiche bouton STOP */
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Nunito",
                    fontWeight: 700,
                    color: "#1565c0",
                  }}
                >
                  ▶ Cycle #{cycleEnCours} en cours…
                </p>
                <p
                  style={{
                    fontFamily: "Nunito",
                    fontSize: "0.85rem",
                    color: "#888",
                  }}
                >
                  Position : {position} % — {vitesseMMin} m/min
                </p>
                <button
                  className="arrosage__nouveau-btn"
                  style={{ backgroundColor: "#e53935" }}
                  onClick={arreterCycle}
                >
                  ■ Arrêter le cycle
                </button>
              </div>
            ) : (
              /* Formulaire de création */
              <div className="arrosage__nouveau">
                <div className="arrosage__nouveau-ligne">
                  <div className="arrosage__nouveau-groupe">
                    <label className="arrosage__nouveau-label">Vitesse</label>
                    <select
                      className="arrosage__nouveau-select"
                      value={nvVitesse}
                      onChange={(e) => setNvVitesse(e.target.value)}
                    >
                      <option value="V1">V1 — Petite vitesse</option>
                      <option value="V2">V2 — Vitesse intermédiaire</option>
                      <option value="V3">V3 — Grande vitesse</option>
                    </select>
                  </div>
                </div>

                <div className="arrosage__nouveau-ligne">
                  <div className="arrosage__nouveau-groupe">
                    <label className="arrosage__nouveau-label">Passages</label>
                    <input
                      type="number"
                      className="arrosage__nouveau-input"
                      min="1"
                      max="10"
                      value={nvPassages}
                      onChange={(e) =>
                        setNvPassages(parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="arrosage__nouveau-groupe">
                    <label className="arrosage__nouveau-label">
                      Durée (min)
                    </label>
                    <input
                      type="number"
                      className="arrosage__nouveau-input"
                      min="1"
                      max="120"
                      value={nvDuree}
                      onChange={(e) =>
                        setNvDuree(parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>

                <button className="arrosage__nouveau-btn" onClick={lancerCycle}>
                  ▶ Lancer le cycle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Panneau Historique */}
        <TableauHistorique historique={historique} />
      </div>
    </>
  );
};

export default CycleArrosage;
