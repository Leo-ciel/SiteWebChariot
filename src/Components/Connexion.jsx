// =============================================
// COMPOSANT : Page de Connexion
// Connecté à l'API PHP + MySQL via LAMP
// =============================================

import { useState } from "react";
import "../styles/Connexion.css";

// ─── URL de l'API PHP (adapte l'IP à ton Raspberry Pi) ───
const API = "http://172.20.10.2/api";

const Connexion = ({ surChangementPage }) => {
  // ─── État local ──────────────────────────────
  const [mode, setMode] = useState("administrateur");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  // ─── Gestion de la soumission ────────────────
  const gererSoumission = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!email || !motDePasse) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }

    setChargement(true);

    try {
      const reponse = await fetch(`${API}/connexion.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse, mode }),
      });

      const donnees = await reponse.json();

      if (donnees.succes) {
        surChangementPage("accueil", {
          mode: donnees.role,
          email: donnees.email,
        });
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
              disabled={chargement}
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
              disabled={chargement}
            />
          </div>

          <button
            type="submit"
            className="connexion__bouton"
            disabled={chargement}
          >
            {chargement ? "Connexion en cours…" : "Se connecter"}
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
