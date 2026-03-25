// =============================================
// COMPOSANT : Page d'Inscription
// Connecté à l'API PHP + MySQL via LAMP
// =============================================

import { useState } from "react";
import "../styles/Inscription.css";

// ─── URL de l'API PHP (adapte l'IP à ton Raspberry Pi) ───
const API = "http://172.20.10.2/api";

// ─── Utilitaire : calcul de la force du mot de passe ─────
const calculerForce = (mdp) => {
  if (!mdp) return 0;
  let score = 0;
  if (mdp.length >= 8) score++;
  if (/[A-Z]/.test(mdp)) score++;
  if (/[0-9]/.test(mdp)) score++;
  if (/[^A-Za-z0-9]/.test(mdp)) score++;
  return score;
};

const etiquetteForce = (score) => {
  switch (score) {
    case 0:
      return "";
    case 1:
      return "Faible";
    case 2:
      return "Moyen";
    case 3:
      return "Fort";
    case 4:
      return "Très fort";
    default:
      return "";
  }
};

const classeForce = (index, score) => {
  if (index >= score) return "inscription__force-barre";
  switch (score) {
    case 1:
      return "inscription__force-barre inscription__force-barre--faible";
    case 2:
      return "inscription__force-barre inscription__force-barre--moyen";
    case 3:
      return "inscription__force-barre inscription__force-barre--fort";
    case 4:
      return "inscription__force-barre inscription__force-barre--tres-fort";
    default:
      return "inscription__force-barre";
  }
};

// ─── Composant principal ─────────────────────────────────
const Inscription = ({ surChangementPage }) => {
  // État du formulaire
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  const forceScore = calculerForce(motDePasse);

  // ─── Validation et soumission ─────────────────────────
  const gererSoumission = async (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");

    // Validations côté client
    if (!email || !motDePasse || !confirmation) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur("Veuillez entrer une adresse email valide.");
      return;
    }

    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);

    try {
      const reponse = await fetch(`${API}/inscription.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      const donnees = await reponse.json();

      if (donnees.succes) {
        setSucces("Compte créé avec succès ! Redirection vers la connexion…");
        setTimeout(() => {
          surChangementPage("connexion");
        }, 1500);
      } else {
        setErreur(donnees.message);
      }
    } catch {
      setErreur(
        "Impossible de contacter le serveur. Vérifiez votre connexion.",
      );
    } finally {
      setChargement(false);
    }
  };

  // ─── Rendu ───────────────────────────────────────────
  return (
    <main className="inscription">
      <div className="inscription__carte">
        <h2 className="inscription__titre">Inscription</h2>

        {/* Message d'erreur */}
        {erreur && (
          <div
            className="inscription__message inscription__message--erreur"
            role="alert"
          >
            {erreur}
          </div>
        )}

        {/* Message de succès */}
        {succes && (
          <div
            className="inscription__message inscription__message--succes"
            role="status"
          >
            {succes}
          </div>
        )}

        {/* Formulaire */}
        <form className="inscription__formulaire" onSubmit={gererSoumission}>
          {/* Email */}
          <div className="inscription__groupe">
            <label className="inscription__label" htmlFor="email-inscription">
              Adresse mail :
            </label>
            <input
              id="email-inscription"
              type="email"
              className="inscription__champ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              autoComplete="email"
              disabled={chargement}
            />
          </div>

          {/* Mot de passe */}
          <div className="inscription__groupe">
            <label className="inscription__label" htmlFor="mdp-inscription">
              Créer votre mot de passe :
            </label>
            <input
              id="mdp-inscription"
              type="password"
              className="inscription__champ"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={chargement}
            />
            {/* Indicateur de force */}
            {motDePasse && (
              <div className="inscription__force-wrapper">
                <div className="inscription__force-barres">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={classeForce(i, forceScore)} />
                  ))}
                </div>
                <span className="inscription__force-texte">
                  {etiquetteForce(forceScore)}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div className="inscription__groupe">
            <label
              className="inscription__label"
              htmlFor="confirmer-inscription"
            >
              Confirmer votre mot de passe :
            </label>
            <input
              id="confirmer-inscription"
              type="password"
              className={`inscription__champ ${
                confirmation && confirmation !== motDePasse
                  ? "inscription__champ--erreur"
                  : ""
              }`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={chargement}
            />
          </div>

          <button
            type="submit"
            className="inscription__bouton"
            disabled={chargement}
          >
            {chargement ? "Création en cours…" : "Création du compte"}
          </button>
        </form>

        {/* Lien retour vers la connexion */}
        <p className="inscription__retour">
          Déjà un compte ?{" "}
          <a
            role="button"
            tabIndex={0}
            onClick={() => surChangementPage("connexion")}
            onKeyDown={(e) =>
              e.key === "Enter" && surChangementPage("connexion")
            }
          >
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
};

export default Inscription;
