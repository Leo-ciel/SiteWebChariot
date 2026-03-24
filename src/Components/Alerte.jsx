// =============================================
// COMPOSANT : Alerte
// =============================================
// Modes par capteur :
//   AUTO   → détection + envoi email automatique (cooldown 60s)
//   MANUEL → détection visible, envoi email sur action utilisateur
//            + bouton Acquitter pour ignorer l'alerte
// =============================================

import emailjs from "@emailjs/browser";
import { useCallback, useEffect, useState } from "react";
import "../styles/Alerte.css";

// ─── Capteurs surveillés ──────────────────────
const CAPTEURS = [
  { id: "debutFinCourse", label: "Début et Fin de course" },
  { id: "roueCodueuse", label: "Roue Codeuse" },
  { id: "cycleArrosage", label: "Cycle d'arrosage" },
];

// ─── Seuils d'alerte par capteur ─────────────
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

// ─── Composant principal ──────────────────────
const Alerte = ({ donneesCapteurs = {} }) => {
  // Config par capteur : actif, mode (auto|manuel), email spécifique
  const [configCapteurs, setConfigCapteurs] = useState(
    Object.fromEntries(
      CAPTEURS.map((c) => [c.id, { actif: true, mode: "auto", email: "" }]),
    ),
  );

  // Email destinataire global
  const [emailGlobal, setEmailGlobal] = useState("");

  // Alertes détectées et affichées (non acquittées)
  const [alertesActives, setAlertesActives] = useState([]);

  // Alertes acquittées manuellement (ignorées jusqu'au prochain dépassement)
  const [alertesAcquittees, setAlertesAcquittees] = useState({});

  // Historique des actions (envois + acquittements)
  const [historique, setHistorique] = useState([]);

  // Cooldown par capteur en mode AUTO (60s entre deux envois)
  const [cooldowns, setCooldowns] = useState({});

  // Envoi en cours (mode manuel)
  const [envoiEnCours, setEnvoiEnCours] = useState({});

  // Envoi test global en cours
  const [testEnCours, setTestEnCours] = useState(false);

  // ─── Initialisation EmailJS ──────────────────
  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  // ─── Ajout dans l'historique ─────────────────
  const ajouterHistorique = (
    labelCapteur,
    message,
    statut,
    action = "envoi",
  ) => {
    setHistorique((prev) => [
      {
        id: Date.now() + Math.random(),
        capteur: labelCapteur,
        message,
        statut,
        action,
        horodatage: new Date().toLocaleString("fr-FR"),
      },
      ...prev.slice(0, 49),
    ]);
  };

  // ─── Envoi d'un email via EmailJS ─────────────
  const envoyerEmail = useCallback(
    async (capteur, message, emailForce) => {
      const destinataire =
        emailForce || configCapteurs[capteur.id]?.email || emailGlobal;
      if (!destinataire) return false;

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
        ajouterHistorique(capteur.label, message, "succes", "envoi");
        return true;
      } catch {
        ajouterHistorique(
          capteur.label,
          `Échec envoi : ${message}`,
          "erreur",
          "envoi",
        );
        return false;
      }
    },
    [configCapteurs, emailGlobal],
  );

  // ─── Surveillance automatique des capteurs ────
  // Se relance à chaque mise à jour de donneesCapteurs
  useEffect(() => {
    const detectees = [];
    const maintenant = Date.now();

    CAPTEURS.forEach((capteur) => {
      const config = configCapteurs[capteur.id];
      if (!config?.actif) return;

      const message = verifierAlerte(capteur.id, donneesCapteurs[capteur.id]);
      if (!message) {
        // Plus d'alerte → réinitialise l'acquittement pour ce capteur
        setAlertesAcquittees((prev) => {
          if (!prev[capteur.id]) return prev;
          const next = { ...prev };
          delete next[capteur.id];
          return next;
        });
        return;
      }

      // Alerte détectée mais déjà acquittée manuellement → on l'ignore
      if (alertesAcquittees[capteur.id] === message) return;

      detectees.push({ ...capteur, message });

      // Mode AUTO uniquement : envoi automatique avec cooldown
      if (config.mode === "auto") {
        const dernierEnvoi = cooldowns[capteur.id] || 0;
        if (maintenant - dernierEnvoi > 60_000) {
          envoyerEmail(capteur, message);
          setCooldowns((prev) => ({ ...prev, [capteur.id]: maintenant }));
        }
      }
      // Mode MANUEL : alerte visible dans l'UI, pas d'envoi automatique
    });

    setAlertesActives(detectees);
  }, [
    donneesCapteurs,
    configCapteurs,
    alertesAcquittees,
    envoyerEmail,
    cooldowns,
  ]);

  // ─── Acquitter une alerte (mode manuel) ──────
  const acquitter = (capteur) => {
    const alerte = alertesActives.find((a) => a.id === capteur.id);
    if (!alerte) return;

    setAlertesAcquittees((prev) => ({
      ...prev,
      [capteur.id]: alerte.message,
    }));
    ajouterHistorique(
      capteur.label,
      alerte.message,
      "acquitte",
      "acquittement",
    );
  };

  // ─── Envoi manuel depuis la carte "Alertes actives" ─
  const envoyerManuel = async (capteur) => {
    const alerte = alertesActives.find((a) => a.id === capteur.id);
    if (!alerte) return;

    setEnvoiEnCours((prev) => ({ ...prev, [capteur.id]: true }));
    await envoyerEmail(capteur, alerte.message);
    setEnvoiEnCours((prev) => ({ ...prev, [capteur.id]: false }));
  };

  // ─── Bascule actif / inactif ──────────────────
  const basculerActif = (id) =>
    setConfigCapteurs((prev) => ({
      ...prev,
      [id]: { ...prev[id], actif: !prev[id].actif },
    }));

  // ─── Bascule mode AUTO / MANUEL ───────────────
  const basculerMode = (id) =>
    setConfigCapteurs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        mode: prev[id].mode === "auto" ? "manuel" : "auto",
      },
    }));

  // ─── Envoi test global ────────────────────────
  const envoyerTest = async () => {
    if (!emailGlobal) {
      alert("Veuillez renseigner un email destinataire global.");
      return;
    }
    setTestEnCours(true);
    for (const capteur of CAPTEURS) {
      if (configCapteurs[capteur.id]?.actif) {
        await envoyerEmail(capteur, "Test alerte manuel", emailGlobal);
      }
    }
    setTestEnCours(false);
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <>
      {/* ════ Ligne 1 : Config capteurs + Email ════ */}
      <div className="alerte__grille">
        {/* ── Config des capteurs ── */}
        <div className="mesures__panneau">
          <div className="mesures__panneau-titre">
            Configuration des capteurs
          </div>
          <div className="mesures__panneau-corps">
            {CAPTEURS.map((capteur) => {
              const config = configCapteurs[capteur.id];
              return (
                <div key={capteur.id} className="alerte__config-ligne">
                  <span className="alerte__toggle-label">{capteur.label}</span>

                  <div className="alerte__config-actions">
                    {/* Toggle ON / OFF */}
                    <button
                      className={`alerte__toggle ${
                        config.actif
                          ? "alerte__toggle--actif"
                          : "alerte__toggle--inactif"
                      }`}
                      onClick={() => basculerActif(capteur.id)}
                      title={config.actif ? "Désactiver" : "Activer"}
                    >
                      <span className="alerte__toggle-rond" />
                    </button>

                    {/* Badge mode AUTO / MANUEL */}
                    {config.actif && (
                      <button
                        className={`alerte__mode-badge ${
                          config.mode === "auto"
                            ? "alerte__mode-badge--auto"
                            : "alerte__mode-badge--manuel"
                        }`}
                        onClick={() => basculerMode(capteur.id)}
                        title={
                          config.mode === "auto"
                            ? "Mode Auto — cliquer pour passer en Manuel"
                            : "Mode Manuel — cliquer pour passer en Auto"
                        }
                      >
                        {config.mode === "auto" ? "⚙ Auto" : "✋ Manuel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Légende */}
            <div className="alerte__legende">
              <span className="alerte__legende-item alerte__legende-item--auto">
                ⚙ Auto : email envoyé automatiquement
              </span>
              <span className="alerte__legende-item alerte__legende-item--manuel">
                ✋ Manuel : email envoyé sur action
              </span>
            </div>
          </div>
        </div>

        {/* ── Config email ── */}
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
              className={`alerte__bouton-envoyer ${testEnCours ? "alerte__bouton-envoyer--cours" : ""}`}
              onClick={envoyerTest}
              disabled={testEnCours}
            >
              {testEnCours ? "Envoi en cours..." : "Envoyer un test d'alerte"}
            </button>
          </div>
        </div>
      </div>

      {/* ════ Ligne 2 : Alertes actives + Historique ════ */}
      <div className="alerte__grille">
        {/* ── Alertes actives ── */}
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
                ✓ Tous les capteurs sont nominaux
              </div>
            ) : (
              alertesActives.map((alerte) => {
                const mode = configCapteurs[alerte.id]?.mode || "auto";
                return (
                  <div key={alerte.id} className="alerte__ligne-alerte">
                    <div className="alerte__ligne-alerte-info">
                      <div className="alerte__ligne-alerte-header">
                        <strong>{alerte.label}</strong>
                        <span
                          className={`alerte__mode-mini alerte__mode-mini--${mode}`}
                        >
                          {mode === "auto" ? "⚙ Auto" : "✋ Manuel"}
                        </span>
                      </div>
                      <p className="alerte__ligne-message">{alerte.message}</p>
                    </div>

                    <div className="alerte__ligne-alerte-actions">
                      {/* Bouton Envoyer (visible en mode MANUEL) */}
                      {mode === "manuel" && (
                        <button
                          className={`alerte__btn-action alerte__btn-action--envoyer ${
                            envoiEnCours[alerte.id]
                              ? "alerte__btn-action--cours"
                              : ""
                          }`}
                          onClick={() => envoyerManuel(alerte)}
                          disabled={envoiEnCours[alerte.id]}
                          title="Envoyer l'email d'alerte manuellement"
                        >
                          {envoiEnCours[alerte.id] ? "…" : "📧 Envoyer"}
                        </button>
                      )}

                      {/* Bouton Acquitter (visible dans les deux modes) */}
                      <button
                        className="alerte__btn-action alerte__btn-action--acquitter"
                        onClick={() => acquitter(alerte)}
                        title="Acquitter — ignore cette alerte jusqu'au prochain dépassement"
                      >
                        ✓ Acquitter
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Historique des actions ── */}
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
                      {entree.action === "acquittement"
                        ? "✓ Acquitté"
                        : entree.statut === "succes"
                          ? "📧 Envoyé"
                          : "✗ Échec"}
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
