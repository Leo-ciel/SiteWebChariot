import emailjs from "@emailjs/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/Alerte.css";

// ─────────────────────────────────────────────
// Capteurs surveillés
// ─────────────────────────────────────────────
const CAPTEURS = [
  { id: "debutFinCourse", label: "Début et Fin de course" },
  { id: "roueCodueuse", label: "Roue Codeuse" },
  { id: "cycleArrosage", label: "Cycle d'arrosage" },
];

// ─────────────────────────────────────────────
// Vérifie si une condition d'alerte est déclenchée
// Retourne un message ou null si tout est normal
// ─────────────────────────────────────────────
function verifierAlerte(idCapteur, donnees) {
  if (!donnees) return null;
  switch (idCapteur) {
    case "debutFinCourse":
      if (donnees.vitesse > 3)
        return `Vitesse excessive : ${donnees.vitesse} m/s`;
      if (donnees.position >= 98) return "Fin de course atteinte";
      if (donnees.position <= 2) return "Début de course atteint";
      break;
    case "roueCodueuse":
      if (donnees.rpm > 280) return `Vitesse critique : ${donnees.rpm} RPM`;
      break;
    case "cycleArrosage":
      if (donnees.electrovanne === "bloquee") return "Électrovanne bloquée";
      break;
    default:
      return null;
  }
  return null;
}

// ─────────────────────────────────────────────
// Composant Alerte
// Props : donneesCapteurs (reçu depuis MesuresTempsReel)
// ─────────────────────────────────────────────
const Alerte = ({ donneesCapteurs = {} }) => {
  const [configCapteurs, setConfigCapteurs] = useState(
    Object.fromEntries(CAPTEURS.map((c) => [c.id, { actif: true, email: "" }])),
  );
  const [emailGlobal, setEmailGlobal] = useState("");
  const [alertesActives, setAlertesActives] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const cooldownsRef = useRef({});

  // Initialisation EmailJS
  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  // Ajout dans l'historique
  const ajouterHistorique = (labelCapteur, message, statut = "succes") => {
    setHistorique((prev) => [
      {
        id: Date.now(),
        capteur: labelCapteur,
        message,
        statut,
        horodatage: new Date().toLocaleString("fr-FR"),
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Envoi d'un email via EmailJS
  const envoyerEmail = useCallback(
    async (capteur, message, emailForce) => {
      const destinataire =
        emailForce || configCapteurs[capteur.id]?.email || emailGlobal;
      if (!destinataire) return;
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            nom_capteur: capteur.label,
            message_alerte: message,
            horodatage: new Date().toLocaleString("fr-FR"),
            email_destinataire: destinataire,
          },
        );
        ajouterHistorique(capteur.label, message, "succes");
      } catch {
        ajouterHistorique(capteur.label, `Échec envoi : ${message}`, "erreur");
      }
    },
    [configCapteurs, emailGlobal],
  );

  // Surveillance automatique à chaque mise à jour des capteurs
  useEffect(() => {
    const detectees = [];

    CAPTEURS.forEach((capteur) => {
      if (!configCapteurs[capteur.id]?.actif) return;
      const message = verifierAlerte(capteur.id, donneesCapteurs[capteur.id]);
      if (!message) return;
      detectees.push({ ...capteur, message });
    });

    setAlertesActives(detectees);
  }, [donneesCapteurs, configCapteurs]);

  // Envoi des alertes avec gestion des cooldowns
  useEffect(() => {
    const maintenant = Date.now();
    const cooldowns = cooldownsRef.current;
    let cooldownsMisAJour = false;

    alertesActives.forEach((alerte) => {
      const dernierEnvoi = cooldowns[alerte.id] || 0;
      if (maintenant - dernierEnvoi > 60_000) {
        const destinataire = configCapteurs[alerte.id]?.email || emailGlobal;
        if (destinataire) {
          envoyerEmail(alerte, alerte.message, destinataire);
          cooldowns[alerte.id] = maintenant;
          cooldownsMisAJour = true;
        }
      }
    });

    if (cooldownsMisAJour) {
      cooldownsRef.current = { ...cooldowns };
    }
  }, [alertesActives, configCapteurs, emailGlobal, envoyerEmail]);

  // Bascule actif/inactif d'un capteur
  const basculerCapteur = (id) =>
    setConfigCapteurs((prev) => ({
      ...prev,
      [id]: { ...prev[id], actif: !prev[id].actif },
    }));

  // Envoi manuel de test
  const envoyerTest = async () => {
    if (!emailGlobal) {
      alert("Veuillez renseigner un email destinataire global.");
      return;
    }
    setEnvoiEnCours(true);
    for (const capteur of CAPTEURS) {
      if (configCapteurs[capteur.id]?.actif) {
        await envoyerEmail(capteur, "Test alerte manuel", emailGlobal);
      }
    }
    setEnvoiEnCours(false);
  };

  return (
    <>
      {/* ── Ligne 1 : Config capteurs + Email ── */}
      <div className="alerte__grille">
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">
            Configuration des capteurs
          </div>
          <div className="mesures__panneau-corps">
            {CAPTEURS.map((capteur) => (
              <div key={capteur.id} className="alerte__toggle-ligne">
                <span className="alerte__toggle-label">{capteur.label}</span>
                <button
                  className={`alerte__toggle ${
                    configCapteurs[capteur.id]?.actif
                      ? "alerte__toggle--actif"
                      : "alerte__toggle--inactif"
                  }`}
                  onClick={() => basculerCapteur(capteur.id)}
                  title={
                    configCapteurs[capteur.id]?.actif ? "Désactiver" : "Activer"
                  }
                >
                  <span className="alerte__toggle-rond" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">Configuration email</div>
          <div className="mesures__panneau-corps">
            <label className="alerte__label">Email destinataire global</label>
            <input
              type="email"
              className="alerte__input"
              placeholder="ex : technicien@example.com"
              value={emailGlobal}
              onChange={(e) => setEmailGlobal(e.target.value)}
            />
            {CAPTEURS.map((capteur) => (
              <div key={capteur.id} className="alerte__email-capteur">
                <label className="alerte__label alerte__label--petit">
                  Email spécifique — {capteur.label}
                </label>
                <input
                  type="email"
                  className="alerte__input alerte__input--petit"
                  placeholder="Optionnel — remplace l'email global"
                  value={configCapteurs[capteur.id]?.email || ""}
                  onChange={(e) =>
                    setConfigCapteurs((prev) => ({
                      ...prev,
                      [capteur.id]: {
                        ...prev[capteur.id],
                        email: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
            <button
              className={`alerte__bouton-envoyer ${envoiEnCours ? "alerte__bouton-envoyer--cours" : ""}`}
              onClick={envoyerTest}
              disabled={envoiEnCours}
            >
              {envoiEnCours ? "Envoi en cours..." : "Envoyer un test d'alerte"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Ligne 2 : Alertes actives + Historique ── */}
      <div className="alerte__grille">
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">
            Alertes actives
            {alertesActives.length > 0 && (
              <span className="alerte__badge alerte__badge--rouge">
                {alertesActives.length}
              </span>
            )}
          </div>
          <div className="mesures__panneau-corps">
            {alertesActives.length === 0 ? (
              <div className="alerte__nominal">
                Tous les capteurs sont nominaux
              </div>
            ) : (
              alertesActives.map((a) => (
                <div key={a.id} className="alerte__ligne-alerte">
                  <div>
                    <strong>{a.label}</strong>
                    <p className="alerte__ligne-message">{a.message}</p>
                  </div>
                  <span className="alerte__badge alerte__badge--orange">
                    ACTIF
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">Historique des alertes</div>
          <div className="mesures__panneau-corps alerte__historique-corps">
            {historique.length === 0 ? (
              <div
                className="mesures__placeholder"
                style={{ minHeight: "60px" }}
              >
                Aucun historique pour le moment
              </div>
            ) : (
              historique.map((entree) => (
                <div
                  key={entree.id}
                  className={`alerte__ligne-historique alerte__ligne-historique--${entree.statut}`}
                >
                  <div>
                    <strong className="alerte__historique-capteur">
                      {entree.capteur}
                    </strong>
                    <p className="alerte__historique-msg">{entree.message}</p>
                  </div>
                  <div className="alerte__historique-droite">
                    <span
                      className={`alerte__historique-statut alerte__historique-statut--${entree.statut}`}
                    >
                      {entree.statut === "succes" ? "Envoyé" : "Échec"}
                    </span>
                    <span className="alerte__historique-date">
                      {entree.horodatage}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Alerte;
