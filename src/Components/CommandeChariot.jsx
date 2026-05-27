// =============================================
// COMPOSANT : Commande Chariot (avec API BDD)
// =============================================
// Toutes les modifications sont marquées [API]
// Le reste du composant est identique à l'original
// =============================================

import { useCallback, useEffect, useRef, useState } from "react"; // [API] useRef + useCallback ajoutés
import "../styles/CommandeChariot.css";

// ─── URL de l'API PHP (adapte l'IP à ton Raspberry Pi) ───
const API = "http://172.20.10.2/api";

// ─── Constantes de vitesse ───────────────────
const VITESSES = {
  1: "Petite Vitesse",
  2: "Vitesse intermédiaire",
  3: "Grande Vitesse",
};

// Angle de l'aiguille selon la position du commutateur
const ANGLE_AIGUILLE = {
  1: -45,
  2: 0,
  3: 45,
};

// [API] URL de l'API PHP — adapter selon ton hébergement
const API_URL = `${API}/api_commande_chariot.php`;

// [API] Fonction utilitaire : envoie un événement à la BDD
async function envoyerEvenement(payload) {
  try {
    const reponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!reponse.ok) {
      const erreur = await reponse.json().catch(() => ({}));
      console.warn(
        "[API] Erreur serveur :",
        erreur.erreur ?? `HTTP ${reponse.status}`,
      );
    }
  } catch (err) {
    // Ne jamais bloquer l'interface si la BDD est indisponible
    console.warn("[API] Impossible de joindre l'API :", err.message);
  }
}

// Déclaration du composant fonctionnel "CommandeChariot"
const CommandeChariot = ({ surChangementPage }) => {
  // ─── États du chariot ────────────────────────
  const [vitesse, setVitesse] = useState(2);
  const [arrosageActif, setArrosageActif] = useState(false);
  const [deplacementActif, setDeplacementActif] = useState(false);
  const [direction, setDirection] = useState(null);
  const [trajetActif, setTrajetActif] = useState(false);
  const [progActif, setProgActif] = useState(false);
  const [messageStatut, setMessageStatut] = useState("Système prêt");
  const [classeStatut, setClasseStatut] = useState("");

  // [API] Synchronisation de l'état arrosage avec la lampe réelle de l'ESP32
  // La lampe physique = remplacement de l'électrovanne (pas d'eau disponible)
  // Lampe allumée → arrosage actif ; éteinte → arrosage inactif
  useEffect(() => {
    const intervalle = setInterval(async () => {
      try {
        const reponse = await fetch(`${API}/capteurs_lire.php`);
        const donnees = await reponse.json();
        if (donnees.succes) {
          setArrosageActif(donnees.electrovanne === 1);
        }
      } catch {
        // Silencieux — ne pas bloquer l'UI si l'API est indisponible
      }
    }, 1500);
    return () => clearInterval(intervalle);
  }, []);

  // [API] Ref pour le throttle des boutons maintenus (← / →)
  const dernierEnvoiRef = useRef(0);

  // [API] Fonction centrale : construit le payload et l'envoie
  // overrides permet de passer les nouvelles valeurs AVANT que
  // les setters React aient mis à jour les states (asynchrones)
  const logAction = useCallback(
    (action, overrides = {}) => {
      const maintenant = Date.now();

      // Throttle 400 ms pour éviter le flood sur maintien du bouton
      const actionsThrottlees = ["deplacement_gauche", "deplacement_droite"];
      if (
        actionsThrottlees.includes(action) &&
        maintenant - dernierEnvoiRef.current < 400
      ) {
        return;
      }
      dernierEnvoiRef.current = maintenant;

      const payload = {
        action,
        vitesse: overrides.vitesse ?? vitesse,
        direction: overrides.direction ?? direction,
        arrosage_actif: overrides.arrosageActif ?? arrosageActif,
        deplacement_actif: overrides.deplacementActif ?? deplacementActif,
        trajet_actif: overrides.trajetActif ?? trajetActif,
        prog_actif: overrides.progActif ?? progActif,
        message_statut: overrides.messageStatut ?? messageStatut,
      };

      envoyerEvenement(payload);
    },
    [
      vitesse,
      direction,
      arrosageActif,
      deplacementActif,
      trajetActif,
      progActif,
      messageStatut,
    ],
  );

  // ─── Utilitaire : mise à jour du statut ──────
  const majStatut = (message, classe = "") => {
    setMessageStatut(message);
    setClasseStatut(classe);
  };

  // ─── BOUTON GAUCHE ← ─────────────────────────
  const gererGauche = () => {
    if (trajetActif) return;
    const msg = "⬅  Déplacement vers la gauche en cours…";
    setDeplacementActif(true);
    setDirection("gauche");
    majStatut(msg, "commande__statut--actif");
    logAction("deplacement_gauche", {
      deplacementActif: true,
      direction: "gauche",
      messageStatut: msg,
    }); // [API]
  };

  const stopperGauche = () => {
    if (trajetActif) return;
    const msg = arrosageActif ? "💧 Arrosage en cours" : "Système prêt";
    const cls = arrosageActif ? "commande__statut--arrosage" : "";
    setDeplacementActif(false);
    setDirection(null);
    majStatut(msg, cls);
    logAction("arret_deplacement", {
      deplacementActif: false,
      direction: null,
      messageStatut: msg,
    }); // [API]
  };

  // ─── BOUTON DROIT → ──────────────────────────
  const gererDroite = () => {
    if (trajetActif) return;
    const msg = "➡  Déplacement vers la droite en cours…";
    setDeplacementActif(true);
    setDirection("droite");
    majStatut(msg, "commande__statut--actif");
    logAction("deplacement_droite", {
      deplacementActif: true,
      direction: "droite",
      messageStatut: msg,
    }); // [API]
  };

  const stopperDroite = () => {
    if (trajetActif) return;
    const msg = arrosageActif ? "💧 Arrosage en cours" : "Système prêt";
    const cls = arrosageActif ? "commande__statut--arrosage" : "";
    setDeplacementActif(false);
    setDirection(null);
    majStatut(msg, cls);
    logAction("arret_deplacement", {
      deplacementActif: false,
      direction: null,
      messageStatut: msg,
    }); // [API]
  };

  // ─── BOUTON ROUGE : tout stopper ─────────────
  const gererRouge = () => {
    const msg = "🔴 ARRÊT — Arrosage et déplacement stoppés";
    setArrosageActif(false);
    setDeplacementActif(false);
    setDirection(null);
    setTrajetActif(false);
    setProgActif(false);
    majStatut(msg, "commande__statut--arret");
    logAction("arret_total", {
      arrosageActif: false,
      deplacementActif: false,
      direction: null,
      trajetActif: false,
      progActif: false,
      messageStatut: msg,
    }); // [API]
  };

  // ─── BOUTON BLEU : ouvrir électrovannes ──────
  const gererBleu = () => {
    if (arrosageActif) {
      const msg = deplacementActif
        ? `${direction === "gauche" ? "⬅" : "➡"} Déplacement en cours (arrosage arrêté)`
        : "Système prêt";
      const cls = deplacementActif ? "commande__statut--actif" : "";
      setArrosageActif(false);
      majStatut(msg, cls);
      logAction("arrosage_off", { arrosageActif: false, messageStatut: msg }); // [API]
    } else {
      const msg = "💧 Électrovannes ouvertes — Arrosage en cours";
      setArrosageActif(true);
      majStatut(msg, "commande__statut--arrosage");
      logAction("arrosage_on", { arrosageActif: true, messageStatut: msg }); // [API]
    }
  };

  // ─── COMMUTATEUR : changer la vitesse ────────
  const gererVitesse = (nouvelleVitesse) => {
    const msg = `⚙️  Vitesse ${nouvelleVitesse} sélectionnée — ${VITESSES[nouvelleVitesse]}`;
    setVitesse(nouvelleVitesse);
    majStatut(msg);
    logAction("changement_vitesse", {
      vitesse: nouvelleVitesse,
      messageStatut: msg,
    }); // [API]
  };

  // ─── BOUTON JAUNE : lancer 1 trajet arrosage ─
  const gererJaune = () => {
    if (trajetActif) return;
    const msg = `🟡 Trajet en cours — ${VITESSES[vitesse]} avec arrosage`;
    setTrajetActif(true);
    setArrosageActif(true);
    setDeplacementActif(true);
    majStatut(msg, "commande__statut--trajet");
    logAction("trajet_lance", {
      trajetActif: true,
      arrosageActif: true,
      deplacementActif: true,
      messageStatut: msg,
    }); // [API]

    setTimeout(() => {
      const msgFin = "✅ Trajet terminé — Système prêt";
      setTrajetActif(false);
      setArrosageActif(false);
      setDeplacementActif(false);
      majStatut(msgFin, "");
      logAction("trajet_termine", {
        trajetActif: false,
        arrosageActif: false,
        deplacementActif: false,
        direction: null,
        messageStatut: msgFin,
      }); // [API]
    }, 10000);
  };

  // ─── PROGRAMMATEUR ───────────────────────────
  const gererProgrammateur = () => {
    if (progActif) {
      const msg = "Programmateur désactivé — Mode manuel";
      setProgActif(false);
      majStatut(msg, "");
      logAction("programmateur_off", { progActif: false, messageStatut: msg }); // [API]
    } else {
      const msg =
        "🕐 Programmateur actif — Intervention technicien requise pour modifier";
      setProgActif(true);
      majStatut(msg, "commande__statut--arrosage");
      logAction("programmateur_on", { progActif: true, messageStatut: msg }); // [API]
    }
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <main className="commande">
      <div className={`commande__statut ${classeStatut}`}>{messageStatut}</div>

      <div className="commande__panneau">
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

        <div className="commande__ligne-haut">
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

        <div className="commande__ligne-bas">
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

          <div className="commande__bouton-groupe">
            <button
              className="commande__bouton-rond commande__bouton-rond--rouge"
              onClick={gererRouge}
              title="ARRÊT — Stoppe l'arrosage et le déplacement"
            />
            <span className="commande__legende">STOP</span>
          </div>

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
