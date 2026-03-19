// =============================================
// COMPOSANT : Page Accueil (après connexion)
// =============================================

import "../styles/Accueil.css";

// ─── Définition des boutons du menu ──────────
const BOUTONS_MENU = [
  { id: "commande-chariot", label: "Commande Chariot" },
  { id: "mesures-temps-reel", label: "Mesures en temps réel" },
  { id: "systeme", label: "Système" },
];

const Accueil = ({ surChangementPage }) => {
  // ─── Gestion du clic sur un bouton ───────────
  const gererClic = (id) => {
    surChangementPage(id);
  };

  // ─── Rendu ───────────────────────────────────
  return (
    <main className="accueil">
      <div className="accueil__carte">
        <h2 className="accueil__titre">Chariot IHM</h2>

        <div className="accueil__liste">
          {BOUTONS_MENU.map((bouton) => (
            <button
              key={bouton.id}
              className="accueil__bouton"
              onClick={() => gererClic(bouton.id)}
            >
              {bouton.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Accueil;
