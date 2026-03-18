// =============================================
// COMPOSANT : Tableau de Bord (après connexion)
// =============================================

import "../styles/TableauDeBord.css";

const TableauDeBord = ({ utilisateur, surDeconnexion }) => {
  return (
    <main className="tableau">
      <div className="tableau__carte">
        <div className="tableau__icone">
          {utilisateur.mode === "administrateur" ? "🛡️" : "👤"}
        </div>
        <h2 className="tableau__titre">Bienvenue !</h2>
        <p className="tableau__sous-titre">
          Connecté en tant que{" "}
          <strong>
            {utilisateur.mode === "administrateur"
              ? "Administrateur"
              : "Utilisateur"}
          </strong>
        </p>
        <p className="tableau__email">{utilisateur.email}</p>

        <div className="tableau__infos">
          <div className="tableau__info-item">
            <span className="tableau__info-label">Rôle</span>
            <span
              className={`tableau__info-valeur ${
                utilisateur.mode === "administrateur"
                  ? "tableau__info-valeur--admin"
                  : "tableau__info-valeur--user"
              }`}
            >
              {utilisateur.mode === "administrateur"
                ? "Administrateur"
                : "Utilisateur"}
            </span>
          </div>
          <div className="tableau__info-item">
            <span className="tableau__info-label">Statut</span>
            <span className="tableau__info-valeur tableau__info-valeur--actif">
              ● Actif
            </span>
          </div>
        </div>

        <button
          className="tableau__bouton-deconnexion"
          onClick={surDeconnexion}
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
};

export default TableauDeBord;
