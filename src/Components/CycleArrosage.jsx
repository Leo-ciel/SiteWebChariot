// =============================================
// COMPOSANT : Cycle d'arrosage
// =============================================

import { useEffect, useRef, useState } from "react";
import "../styles/CycleArrosage.css";
import TableauHistorique from "./TableauHistorique";

const API = "http://172.20.10.2/api";
const heureActuelle = () => new Date().toLocaleTimeString("fr-FR");

async function envoyerCommande(action, vitesseNum = 0) {
  try {
    await fetch(`${API}/api_commande_chariot.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        vitesse: vitesseNum,
        arrosage_actif: action === "trajet_lance",
        deplacement_actif: action === "trajet_lance",
        trajet_actif: action === "trajet_lance",
        prog_actif: false,
        message_statut: action,
      }),
    });
  } catch (err) {
    console.warn("[API] Erreur envoi commande :", err.message);
  }
}

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

const SchemaElectrovanne = ({ ouverte }) => (
  <svg
    className="arrosage__schema-svg"
    viewBox="0 0 280 160"
    xmlns="http://www.w3.org/2000/svg"
  >
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
    {ouverte ? (
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
    <line
      x1="115"
      y1="36"
      x2="115"
      y2="50"
      stroke={ouverte ? "#1565c0" : "#888"}
      strokeWidth="3"
      style={{ transition: "stroke 0.4s ease" }}
    />
    <circle
      cx="115"
      cy="52"
      r="6"
      fill={ouverte ? "#42a5f5" : "#777"}
      stroke="#333"
      strokeWidth="1.5"
      style={{ transition: "fill 0.4s ease" }}
    />
    <path
      d="M 230 80 Q 255 60 260 80 Q 255 100 270 95"
      fill="none"
      stroke="#aaa"
      strokeWidth="8"
      strokeLinecap="round"
    />
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

const CycleArrosage = ({ onDonnees }) => {
  const [modeAuto, setModeAuto] = useState(false);
  const [electrovanneOuverte, setElectrovanneOuverte] = useState(false);
  const [position, setPosition] = useState(0);
  const [vitesseMMin, setVitesseMMin] = useState(0);
  const [cycles, setCycles] = useState(CYCLES_INITIAUX);
  const [cycleEnCours, setCycleEnCours] = useState(null);
  const [historique, setHistorique] = useState(HISTORIQUE_INITIAL);
  const [nvVitesse, setNvVitesse] = useState("V1");
  const [nvPassages, setNvPassages] = useState(1);
  const [nvDuree, setNvDuree] = useState(10);

  const timerCycleRef = useRef(null);
  const debut = "0 %";
  const fin = "100 %";

  // ─── Lecture capteurs toutes les 1.5s ────────
  useEffect(() => {
    const intervalle = setInterval(async () => {
      try {
        const reponse = await fetch(`${API}/capteurs_lire.php`);
        const donnees = await reponse.json();
        if (donnees.succes) {
          setPosition(parseFloat(donnees.position_chariot.toFixed(1)));
          setElectrovanneOuverte(donnees.electrovanne === 1);
          setVitesseMMin(donnees.vitesse);
          onDonnees?.({
            electrovanne: donnees.electrovanne === 1 ? "ouverte" : "fermee",
          });
        }
      } catch (erreur) {
        console.error("Erreur lecture capteurs :", erreur);
      }
    }, 1500);
    return () => clearInterval(intervalle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Utilitaires ─────────────────────────────
  const ajouterEvenement = (evenement, statut = "ok") => {
    setHistorique((prev) => [
      { id: prev.length + 1, heure: heureActuelle(), evenement, statut },
      ...prev.slice(0, 9),
    ]);
  };

  const basculerMode = () => {
    const nouveau = !modeAuto;
    setModeAuto(nouveau);
    ajouterEvenement(`Mode basculé → ${nouveau ? "Automatique" : "Manuel"}`);
  };

  const basculerElectrovanne = () => {
    const nouvelEtat = !electrovanneOuverte;
    setElectrovanneOuverte(nouvelEtat);
    onDonnees?.({ electrovanne: nouvelEtat ? "ouverte" : "fermee" });
    ajouterEvenement(`Électrovanne ${nouvelEtat ? "ouverte" : "fermée"}`);
  };

  // ─── Logique commune de fin de cycle ─────────
  // Utilise uniquement des setters stables (pas de closure sur des states)
  const _finalisierCycle = (statut, evenement) => {
    if (timerCycleRef.current) {
      clearTimeout(timerCycleRef.current);
      timerCycleRef.current = null;
    }
    setCycleEnCours(null);
    setElectrovanneOuverte(false);
    onDonnees?.({ electrovanne: "fermee" });
    setCycles((prev) =>
      prev.map((c) => (c.statut === "cours" ? { ...c, statut } : c)),
    );
    setHistorique((prev) => [
      { id: prev.length + 1, heure: heureActuelle(), evenement, statut: "ok" },
      ...prev.slice(0, 9),
    ]);
  };

  // ─── Lancer un cycle ──────────────────────────
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
    onDonnees?.({ electrovanne: "ouverte" });

    // Timer de fin automatique
    const dureeMs = nvDuree * 60 * 1000;
    if (timerCycleRef.current) clearTimeout(timerCycleRef.current);
    timerCycleRef.current = setTimeout(async () => {
      timerCycleRef.current = null;
      setCycleEnCours(null);
      setElectrovanneOuverte(false);
      setCycles((prev) =>
        prev.map((c) => (c.statut === "cours" ? { ...c, statut: "ok" } : c)),
      );
      setHistorique((prev) => [
        {
          id: prev.length + 1,
          heure: heureActuelle(),
          evenement: "Cycle terminé automatiquement",
          statut: "ok",
        },
        ...prev.slice(0, 9),
      ]);
      // Envoyer d'abord trajet_termine (stop moteur), puis arrosage_off
      // (pour contrer handleBackgroundAutomation qui relit BULB_PIN toutes les 200ms)
      await envoyerCommande("trajet_termine", 1);
      setTimeout(() => envoyerCommande("arrosage_off", 1), 600);
    }, dureeMs);

    const vitesseNum = nvVitesse === "V1" ? 1 : nvVitesse === "V2" ? 2 : 3;
    envoyerCommande("trajet_lance", vitesseNum);
    ajouterEvenement(
      `Nouveau cycle lancé — ${nomVitesse}, ${nvPassages} passage(s), ${nvDuree} min`,
    );
  };

  // ─── Terminer (automatique) ───────────────────
  const terminerCycle = async () => {
    _finalisierCycle(
      "ok",
      "Cycle terminé — Électrovanne fermée automatiquement",
    );
    await envoyerCommande("trajet_termine", 1);
    setTimeout(() => envoyerCommande("arrosage_off", 1), 600);
  };

  // ─── Arrêter (manuel) ─────────────────────────
  const arreterCycle = async () => {
    _finalisierCycle("arrete", "Cycle interrompu manuellement");
    await envoyerCommande("arret_total", 1);
    setTimeout(() => envoyerCommande("arrosage_off", 1), 600);
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <>
      <div className="arrosage__actions">
        <button
          className={`arrosage__btn-mode ${modeAuto ? "arrosage__btn-mode--auto" : "arrosage__btn-mode--manuel"}`}
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

        <button
          className={`arrosage__btn-electrovanne ${electrovanneOuverte ? "arrosage__btn-electrovanne--ouverte" : "arrosage__btn-electrovanne--fermee"}`}
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
            className={`mesures__indicateur-valeur ${cycleEnCours ? "mesures__indicateur-valeur--vert" : ""}`}
          >
            {cycleEnCours ? `${vitesseMMin} m/min` : "—"}
          </span>
        </div>
      </div>

      <div className="arrosage__grille">
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">
            {cycleEnCours && <span className="mesures__live-dot" />}
            Position sur la course
          </div>
          <div className="mesures__panneau-corps">
            <div className="arrosage__schema-wrapper">
              <SchemaElectrovanne ouverte={electrovanneOuverte} />
              <span
                className={`arrosage__schema-statut ${electrovanneOuverte ? "arrosage__schema-statut--ouvert" : "arrosage__schema-statut--ferme"}`}
              >
                {electrovanneOuverte
                  ? "✓ Électrovanne ouverte"
                  : "✗ Électrovanne fermée"}
              </span>
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
                    className={`arrosage__cycle-item ${cycle.statut === "cours" ? "arrosage__cycle-item--en-cours" : ""}`}
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

      <div className="arrosage__grille">
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">Nouveau Cycle</div>
          <div className="mesures__panneau-corps">
            {cycleEnCours ? (
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

        <TableauHistorique historique={historique} />
      </div>
    </>
  );
};

export default CycleArrosage;
