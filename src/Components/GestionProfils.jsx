// =============================================
// COMPOSANT : Gestion des profils
// =============================================
// Fonctionnalités :
//   - Statistiques (total, admin, utilisateurs)
//   - Tableau des comptes avec suppression
//   - Formulaire d'ajout d'un nouveau compte
//   - Formulaire de modification inline
// =============================================

import { useState } from "react";
import "../styles/GestionProfils.css";

// ─── Utilitaires ─────────────────────────────
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
  const niveaux = ["", "Faible", "Moyen", "Fort", "Très fort"];
  return niveaux[score] || "";
};

// ─── Composant principal ─────────────────────
const GestionProfils = ({
  comptes,
  surAjoutCompte,
  surSuppressionCompte,
  surModificationCompte,
}) => {
  // ─── État formulaire ajout ────────────────
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("utilisateur");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  // ─── Modification inline ──────────────────
  const [enModification, setEnModification] = useState(null); // email du compte en cours
  const [nvMotDePasse, setNvMotDePasse] = useState("");
  const [nvRole, setNvRole] = useState("");

  // ─── Confirmation de suppression ─────────
  const [confirmerSuppression, setConfirmerSuppression] = useState(null);

  const forceScore = calculerForce(motDePasse);

  // ─── Statistiques ─────────────────────────
  const totalComptes = comptes.length;
  const nbAdmins = comptes.filter((c) => c.role === "administrateur").length;
  const nbUtilisateurs = comptes.filter(
    (c) => c.role !== "administrateur",
  ).length;

  // ─── Ajout d'un compte ────────────────────
  const gererAjout = (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");

    if (!email || !motDePasse) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setErreur("Adresse email invalide.");
      return;
    }
    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (comptes.find((c) => c.email === email)) {
      setErreur("Un compte avec cet email existe déjà.");
      return;
    }

    surAjoutCompte({ email, motDePasse, role });
    setSucces(`Compte "${email}" créé avec succès !`);
    setEmail("");
    setMotDePasse("");
    setRole("utilisateur");
    setTimeout(() => setSucces(""), 3000);
  };

  // ─── Ouverture de la modification ────────
  const ouvrirModification = (compte) => {
    setEnModification(compte.email);
    setNvMotDePasse("");
    setNvRole(compte.role || "utilisateur");
  };

  // ─── Sauvegarde de la modification ───────
  const sauvegarderModification = (compte) => {
    surModificationCompte({
      ...compte,
      motDePasse: nvMotDePasse || compte.motDePasse,
      role: nvRole,
    });
    setEnModification(null);
  };

  // ─── Suppression ─────────────────────────
  const gererSuppression = (email) => {
    if (confirmerSuppression === email) {
      surSuppressionCompte(email);
      setConfirmerSuppression(null);
    } else {
      setConfirmerSuppression(email);
    }
  };

  // ─── Rendu ───────────────────────────────
  return (
    <div className="profils">
      {/* ── Cartes statistiques ── */}
      <div className="profils__stats">
        <div className="profils__stat-carte">
          <span className="profils__stat-valeur">{totalComptes}</span>
          <span className="profils__stat-label">Comptes total</span>
        </div>
        <div className="profils__stat-carte profils__stat-carte--admin">
          <span className="profils__stat-valeur">{nbAdmins}</span>
          <span className="profils__stat-label">Administrateurs</span>
        </div>
        <div className="profils__stat-carte profils__stat-carte--user">
          <span className="profils__stat-valeur">{nbUtilisateurs}</span>
          <span className="profils__stat-label">Utilisateurs</span>
        </div>
      </div>

      <div className="profils__grille">
        {/* ── Tableau des comptes ── */}
        <div className="profils__panneau profils__panneau--large">
          <div className="profils__panneau-titre">
            Comptes enregistrés
            {totalComptes > 0 && (
              <span className="profils__badge">{totalComptes}</span>
            )}
          </div>
          <div className="profils__panneau-corps">
            {comptes.length === 0 ? (
              <div className="profils__vide">
                Aucun compte utilisateur enregistré.
              </div>
            ) : (
              <table className="profils__tableau">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comptes.map((compte) => (
                    <>
                      <tr key={compte.email}>
                        <td className="profils__tableau-email">
                          {compte.email}
                        </td>
                        <td>
                          <span
                            className={`profils__role-badge profils__role-badge--${compte.role === "administrateur" ? "admin" : "user"}`}
                          >
                            {compte.role === "administrateur"
                              ? "🔑 Admin"
                              : "👤 Utilisateur"}
                          </span>
                        </td>
                        <td className="profils__tableau-actions">
                          <button
                            className="profils__btn profils__btn--modifier"
                            onClick={() =>
                              enModification === compte.email
                                ? setEnModification(null)
                                : ouvrirModification(compte)
                            }
                          >
                            {enModification === compte.email
                              ? "✕ Annuler"
                              : "✏ Modifier"}
                          </button>
                          <button
                            className={`profils__btn ${
                              confirmerSuppression === compte.email
                                ? "profils__btn--confirmer"
                                : "profils__btn--supprimer"
                            }`}
                            onClick={() => gererSuppression(compte.email)}
                          >
                            {confirmerSuppression === compte.email
                              ? "⚠ Confirmer"
                              : "🗑 Supprimer"}
                          </button>
                        </td>
                      </tr>

                      {/* Ligne de modification inline */}
                      {enModification === compte.email && (
                        <tr
                          key={`${compte.email}-edit`}
                          className="profils__ligne-edition"
                        >
                          <td colSpan="3">
                            <div className="profils__edition">
                              <div className="profils__edition-groupe">
                                <label className="profils__edition-label">
                                  Nouveau mot de passe
                                </label>
                                <input
                                  type="password"
                                  className="profils__edition-input"
                                  placeholder="Laisser vide pour ne pas changer"
                                  value={nvMotDePasse}
                                  onChange={(e) =>
                                    setNvMotDePasse(e.target.value)
                                  }
                                />
                              </div>
                              <div className="profils__edition-groupe">
                                <label className="profils__edition-label">
                                  Rôle
                                </label>
                                <select
                                  className="profils__edition-select"
                                  value={nvRole}
                                  onChange={(e) => setNvRole(e.target.value)}
                                >
                                  <option value="utilisateur">
                                    Utilisateur
                                  </option>
                                  <option value="administrateur">
                                    Administrateur
                                  </option>
                                </select>
                              </div>
                              <button
                                className="profils__btn profils__btn--sauvegarder"
                                onClick={() => sauvegarderModification(compte)}
                              >
                                ✓ Sauvegarder
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Formulaire d'ajout ── */}
        <div className="profils__panneau">
          <div className="profils__panneau-titre">Ajouter un compte</div>
          <div className="profils__panneau-corps">
            {erreur && (
              <div
                className="profils__message profils__message--erreur"
                role="alert"
              >
                {erreur}
              </div>
            )}
            {succes && (
              <div
                className="profils__message profils__message--succes"
                role="status"
              >
                {succes}
              </div>
            )}

            <form className="profils__formulaire" onSubmit={gererAjout}>
              <div className="profils__groupe">
                <label className="profils__label" htmlFor="gp-email">
                  Adresse email
                </label>
                <input
                  id="gp-email"
                  type="email"
                  className="profils__champ"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="profils__groupe">
                <label className="profils__label" htmlFor="gp-mdp">
                  Mot de passe
                </label>
                <input
                  id="gp-mdp"
                  type="password"
                  className="profils__champ"
                  placeholder="8 caractères minimum"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  autoComplete="new-password"
                />
                {motDePasse && (
                  <div className="profils__force-wrapper">
                    <div className="profils__force-barres">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`profils__force-barre ${
                            i < forceScore
                              ? `profils__force-barre--${["faible", "moyen", "fort", "tres-fort"][forceScore - 1]}`
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                    <span className="profils__force-texte">
                      {etiquetteForce(forceScore)}
                    </span>
                  </div>
                )}
              </div>

              <div className="profils__groupe">
                <label className="profils__label" htmlFor="gp-role">
                  Rôle
                </label>
                <select
                  id="gp-role"
                  className="profils__champ profils__champ--select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="utilisateur">Utilisateur</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>

              <button type="submit" className="profils__bouton-ajouter">
                + Créer le compte
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionProfils;
