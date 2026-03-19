// =============================================
// COMPOSANT : En-tête — Pyrène Automation
// =============================================

import logo from "../image/logo.png"; // Logo de Pyrène (sphère verte/bleue) - à remplacer par un SVG intégré pour plus de flexibilité
import "../styles/EnTete.css";

// ─── En-tête (haut de page) ───────────────────
// La prop `titre` permet d'afficher un titre de page (ex: "Accueil")
// Si absente, affiche "Pyrène Automation" par défaut
export const EnTete = ({ titre }) => {
  return (
    <header className="entete">
      <img src={logo} alt="Logo Pyrène" className="entete__logo" />
      <h1 className="entete__titre">{titre || "Pyrène Automation"}</h1>
    </header>
  );
};

// ─── Pied de page (bas de page) ───────────────
export const PiedDePage = () => {
  return <footer className="pied-de-page"></footer>;
};

export default EnTete;
