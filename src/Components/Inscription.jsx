// =============================================
// COMPOSANT : Page d'Inscription
// =============================================

import { useState } from "react";
import "../styles/Inscription.css";

// ─── Utilitaire : calcul de la force du mot de passe ─
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

// ─── Composant principal ─────────────────────
const Inscription = ({ comptes, surNouveauCompte, surChangementPage }) => {
  // État du formulaire
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const forceScore = calculerForce(motDePasse);

  // ─── Validation et soumission ───────────────
  const gererSoumission = (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");

    // Vérifications
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

    // Vérifier si le compte existe déjà
    const dejaExistant = comptes.find((c) => c.email === email);
    if (dejaExistant) {
      setErreur("Un compte avec cet email existe déjà.");
      return;
    }

    // Création du compte
    surNouveauCompte({ email, motDePasse });
    setSucces("Compte créé avec succès ! Redirection vers la connexion…");

    // Redirection automatique après 1.5s
    setTimeout(() => {
      surChangementPage("connexion");
    }, 1500);
  };

  // ─── Rendu ───────────────────────────────────
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
            />
          </div>

          <button type="submit" className="inscription__bouton">
            Création du compte
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
