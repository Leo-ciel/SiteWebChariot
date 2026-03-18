// =============================================
// COMPOSANT : Page de Connexion
// =============================================

import { useState } from "react";
import "../styles/Connexion.css";

// Compte administrateur par défaut (hardcodé)
const COMPTE_ADMIN = {
  email: "admin@pyrene.fr",
  motDePasse: "Admin1234",
  mode: "administrateur",
};

const Connexion = ({ comptes, surChangementPage }) => {
  // ─── État local ──────────────────────────────
  const [mode, setMode] = useState("administrateur");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  // ─── Gestion de la soumission ────────────────
  const gererSoumission = (e) => {
    e.preventDefault();
    setErreur("");

    if (!email || !motDePasse) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }

    // Vérification selon le mode sélectionné
    if (mode === "administrateur") {
      // Authentification admin (compte unique hardcodé)
      if (
        email === COMPTE_ADMIN.email &&
        motDePasse === COMPTE_ADMIN.motDePasse
      ) {
        surChangementPage("tableau-de-bord", { mode: "administrateur", email });
      } else {
        setErreur(
          "Identifiants administrateur incorrects. Vérifiez vos informations.",
        );
      }
    } else {
      // Authentification utilisateur (comptes créés via inscription)
      const compteExistant = comptes.find(
        (c) => c.email === email && c.motDePasse === motDePasse,
      );

      if (compteExistant) {
        surChangementPage("tableau-de-bord", { mode: "utilisateur", email });
      } else {
        // Vérifier si l'email existe mais mot de passe incorrect
        const emailExistant = comptes.find((c) => c.email === email);
        if (emailExistant) {
          setErreur("Mot de passe incorrect. Veuillez réessayer.");
        } else {
          setErreur(
            "Aucun compte trouvé avec cet email. Veuillez d'abord vous inscrire.",
          );
        }
      }
    }
  };

  // ─── Changement d'onglet ─────────────────────
  const changerMode = (nouveauMode) => {
    setMode(nouveauMode);
    setErreur("");
    setEmail("");
    setMotDePasse("");
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <main className="connexion">
      <div className="connexion__carte">
        <h2 className="connexion__titre">Connexion</h2>

        {/* Onglets Administrateur / Utilisateur */}
        <div className="connexion__onglets" role="tablist">
          <button
            role="tab"
            aria-selected={mode === "administrateur"}
            className={`connexion__onglet ${
              mode === "administrateur" ? "connexion__onglet--actif" : ""
            }`}
            onClick={() => changerMode("administrateur")}
          >
            Administrateur
          </button>
          <button
            role="tab"
            aria-selected={mode === "utilisateur"}
            className={`connexion__onglet ${
              mode === "utilisateur" ? "connexion__onglet--actif" : ""
            }`}
            onClick={() => changerMode("utilisateur")}
          >
            Utilisateur
          </button>
        </div>

        {/* Message d'erreur */}
        {erreur && (
          <div className="connexion__erreur" role="alert">
            {erreur}
          </div>
        )}

        {/* Formulaire */}
        <form className="connexion__formulaire" onSubmit={gererSoumission}>
          <div className="connexion__groupe">
            <label className="connexion__label" htmlFor="email-connexion">
              Adresse mail :
            </label>
            <input
              id="email-connexion"
              type="email"
              className="connexion__champ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                mode === "administrateur" ? "admin@pyrene.fr" : "votre@email.fr"
              }
              autoComplete="email"
            />
          </div>

          <div className="connexion__groupe">
            <label className="connexion__label" htmlFor="mdp-connexion">
              Mot de passe :
            </label>
            <input
              id="mdp-connexion"
              type="password"
              className="connexion__champ"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="connexion__bouton">
            Se connecter
          </button>
        </form>

        {/* Lien vers l'inscription (visible uniquement en mode utilisateur) */}
        {mode === "utilisateur" && (
          <p className="connexion__lien-inscription">
            Pas de compte ?{" "}
            <a
              role="button"
              tabIndex={0}
              onClick={() => surChangementPage("inscription")}
              onKeyDown={(e) =>
                e.key === "Enter" && surChangementPage("inscription")
              }
            >
              S&apos;inscrire
            </a>
          </p>
        )}
      </div>
    </main>
  );
};

export default Connexion;
