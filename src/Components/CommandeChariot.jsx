// =============================================
// COMPOSANT : Commande Chariot
// =============================================
// Comportement des boutons :
//   ← / →     : Déplace la rampe dans les deux sens
//   Rouge      : Stoppe l'arrosage ET le déplacement
//   Bleu       : Ouvre les électrovannes (arrosage)
//   Commutateur: Sélectionne la vitesse (1, 2 ou 3)
//   Jaune      : Lance 1 trajet en arrosant à la vitesse sélectionnée
//   Programmateur : Mode automatique (non modifiable sans technicien)
// =============================================

import { useState } from "react";
import "../styles/CommandeChariot.css";

// ─── Constantes de vitesse ───────────────────
const VITESSES = {
  1: "Petite Vitesse",
  2: "Vitesse intermédiaire",
  3: "Grande Vitesse",
};

// Angle de l'aiguille selon la position du commutateur
const ANGLE_AIGUILLE = {
  1: -45, // gauche
  2: 0, // milieu (vertical)
  3: 45, // droite
};

const CommandeChariot = ({ surChangementPage }) => {
  // ─── États du chariot ────────────────────────
  const [vitesse, setVitesse] = useState(2);
  const [arrosageActif, setArrosageActif] = useState(false);
  const [deplacementActif, setDeplacementActif] = useState(false);
  const [direction, setDirection] = useState(null); // 'gauche' | 'droite'
  const [trajetActif, setTrajetActif] = useState(false);
  const [progActif, setProgActif] = useState(false);
  const [messageStatut, setMessageStatut] = useState("Système prêt");
  const [classeStatut, setClasseStatut] = useState("");

  // ─── Utilitaire : mise à jour du statut ──────
  const majStatut = (message, classe = "") => {
    setMessageStatut(message);
    setClasseStatut(classe);
  };

  // ─── BOUTON GAUCHE ← ─────────────────────────
  const gererGauche = () => {
    if (trajetActif) return;
    setDeplacementActif(true);
    setDirection("gauche");
    majStatut(
      "⬅  Déplacement vers la gauche en cours…",
      "commande__statut--actif",
    );
  };

  const stopperGauche = () => {
    if (trajetActif) return;
    setDeplacementActif(false);
    setDirection(null);
    majStatut(
      arrosageActif ? "💧 Arrosage en cours" : "Système prêt",
      arrosageActif ? "commande__statut--arrosage" : "",
    );
  };

  // ─── BOUTON DROIT → ──────────────────────────
  const gererDroite = () => {
    if (trajetActif) return;
    setDeplacementActif(true);
    setDirection("droite");
    majStatut(
      "➡  Déplacement vers la droite en cours…",
      "commande__statut--actif",
    );
  };

  const stopperDroite = () => {
    if (trajetActif) return;
    setDeplacementActif(false);
    setDirection(null);
    majStatut(
      arrosageActif ? "💧 Arrosage en cours" : "Système prêt",
      arrosageActif ? "commande__statut--arrosage" : "",
    );
  };

  // ─── BOUTON ROUGE : tout stopper ─────────────
  const gererRouge = () => {
    setArrosageActif(false);
    setDeplacementActif(false);
    setDirection(null);
    setTrajetActif(false);
    setProgActif(false);
    majStatut(
      "🔴 ARRÊT — Arrosage et déplacement stoppés",
      "commande__statut--arret",
    );
  };

  // ─── BOUTON BLEU : ouvrir électrovannes ──────
  const gererBleu = () => {
    if (arrosageActif) {
      // Bascule : fermer les électrovannes
      setArrosageActif(false);
      majStatut(
        deplacementActif
          ? `${direction === "gauche" ? "⬅" : "➡"} Déplacement en cours (arrosage arrêté)`
          : "Système prêt",
        deplacementActif ? "commande__statut--actif" : "",
      );
    } else {
      setArrosageActif(true);
      majStatut(
        "💧 Électrovannes ouvertes — Arrosage en cours",
        "commande__statut--arrosage",
      );
    }
  };

  // ─── COMMUTATEUR : changer la vitesse ────────
  const gererVitesse = (nouvelleVitesse) => {
    setVitesse(nouvelleVitesse);
    majStatut(
      `⚙️  Vitesse ${nouvelleVitesse} sélectionnée — ${VITESSES[nouvelleVitesse]}`,
    );
  };

  // ─── BOUTON JAUNE : lancer 1 trajet arrosage ─
  const gererJaune = () => {
    if (trajetActif) return;
    setTrajetActif(true);
    setArrosageActif(true);
    setDeplacementActif(true);
    majStatut(
      `🟡 Trajet en cours — ${VITESSES[vitesse]} avec arrosage`,
      "commande__statut--trajet",
    );
    // Simulation fin de trajet après 4 secondes
    setTimeout(() => {
      setTrajetActif(false);
      setArrosageActif(false);
      setDeplacementActif(false);
      majStatut("✅ Trajet terminé — Système prêt", "");
    }, 10000);
  };

  // ─── PROGRAMMATEUR ───────────────────────────
  const gererProgrammateur = () => {
    if (progActif) {
      setProgActif(false);
      majStatut("Programmateur désactivé — Mode manuel", "");
    } else {
      setProgActif(true);
      majStatut(
        "🕐 Programmateur actif — Intervention technicien requise pour modifier",
        "commande__statut--arrosage",
      );
    }
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <main className="commande">
      {/* Bandeau de statut */}
      <div className={`commande__statut ${classeStatut}`}>{messageStatut}</div>

      {/* Panneau des boutons */}
      <div className="commande__panneau">
        {/* ── Ligne 0 : Programmateur ── */}
        <div className="commande__ligne-prog">
          <div className="commande__bouton-groupe">
            <button
              className={`commande__programmateur ${progActif ? "commande__programmateur--actif" : ""}`}
              onClick={gererProgrammateur}
              title="Mode automatique — Non modifiable sans technicien"
            >
              Programmateur
            </button>
          </div>
        </div>

        {/* ── Ligne 1 : Bleu · Commutateur · Jaune ── */}
        <div className="commande__ligne-haut">
          {/* Bouton Bleu */}
          <div className="commande__bouton-groupe">
            <button
              className={`commande__bouton-rond commande__bouton-rond--bleu`}
              onClick={gererBleu}
              title={
                arrosageActif
                  ? "Fermer les électrovannes"
                  : "Ouvrir les électrovannes"
              }
              style={{ opacity: arrosageActif ? 1 : 0.85 }}
            />
            <span className="commande__legende">
              {arrosageActif ? "Arrosage ON" : "Électrovannes"}
            </span>
          </div>

          {/* Commutateur rotatif */}
          <div className="commande__commutateur-wrapper">
            <div className="commande__commutateur-positions">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={vitesse === n ? "actif" : ""}
                  onClick={() => gererVitesse(n)}
                  title={VITESSES[n]}
                >
                  {n}
                </span>
              ))}
            </div>
            <button
              className="commande__commutateur"
              onClick={() => gererVitesse(vitesse === 3 ? 1 : vitesse + 1)}
              title={`Vitesse actuelle : ${VITESSES[vitesse]} — Cliquer pour changer`}
            >
              <div
                className="commande__commutateur-aiguille"
                style={{ transform: `rotate(${ANGLE_AIGUILLE[vitesse]}deg)` }}
              />
            </button>
            <span className="commande__vitesse-badge">
              V{vitesse} — {VITESSES[vitesse]}
            </span>
          </div>

          {/* Bouton Jaune */}
          <div className="commande__bouton-groupe">
            <button
              className="commande__bouton-rond commande__bouton-rond--jaune"
              onClick={gererJaune}
              disabled={trajetActif}
              title={`Lancer 1 trajet avec arrosage à ${VITESSES[vitesse]}`}
              style={{ opacity: trajetActif ? 0.6 : 1 }}
            />
            <span className="commande__legende">
              {trajetActif ? "Trajet…" : "1 Trajet"}
            </span>
          </div>
        </div>

        {/* ── Ligne 2 : ← · Rouge · → ── */}
        <div className="commande__ligne-bas">
          {/* Flèche Gauche */}
          <div className="commande__bouton-groupe">
            <button
              className="commande__bouton-rond commande__bouton-rond--noir"
              onMouseDown={gererGauche}
              onMouseUp={stopperGauche}
              onMouseLeave={stopperGauche}
              onTouchStart={gererGauche}
              onTouchEnd={stopperGauche}
              disabled={trajetActif}
              title="Déplacer la rampe vers la gauche (maintenir appuyé)"
              style={{ opacity: trajetActif ? 0.5 : 1 }}
            >
              ←
            </button>
            <span className="commande__legende">Gauche</span>
          </div>

          {/* Bouton Rouge STOP */}
          <div className="commande__bouton-groupe">
            <button
              className="commande__bouton-rond commande__bouton-rond--rouge"
              onClick={gererRouge}
              title="ARRÊT — Stoppe l'arrosage et le déplacement"
            />
            <span className="commande__legende">STOP</span>
          </div>

          {/* Flèche Droite */}
          <div className="commande__bouton-groupe">
            <button
              className="commande__bouton-rond commande__bouton-rond--noir"
              onMouseDown={gererDroite}
              onMouseUp={stopperDroite}
              onMouseLeave={stopperDroite}
              onTouchStart={gererDroite}
              onTouchEnd={stopperDroite}
              disabled={trajetActif}
              title="Déplacer la rampe vers la droite (maintenir appuyé)"
              style={{ opacity: trajetActif ? 0.5 : 1 }}
            >
              →
            </button>
            <span className="commande__legende">Droite</span>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button
        className="commande__retour"
        onClick={() => surChangementPage("accueil")}
      >
        ← Retour à l&apos;accueil
      </button>
    </main>
  );
};

export default CommandeChariot;
