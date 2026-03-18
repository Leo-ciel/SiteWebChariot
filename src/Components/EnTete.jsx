// =============================================
// COMPOSANT : En-tête — Pyrène Automation
// =============================================

import "../styles/EnTete.css";

// Logo SVG intégré directement (représentation de la sphère verte/bleue)
const LogoPyrene = () => (
  <svg
    viewBox="0 0 60 60"
    xmlns="http://www.w3.org/2000/svg"
    className="entete__logo"
  >
    <defs>
      <radialGradient id="gradVert" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#a8e06a" />
        <stop offset="100%" stopColor="#4a8c1c" />
      </radialGradient>
      <radialGradient id="gradBleu" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#60c8f0" />
        <stop offset="100%" stopColor="#1a6aa0" />
      </radialGradient>
    </defs>
    <circle cx="30" cy="30" r="28" fill="url(#gradVert)" />
    <path
      d="M 30 2 Q 10 20 30 38 Q 50 20 30 2"
      fill="url(#gradBleu)"
      opacity="0.9"
    />
    <path
      d="M 10 42 Q 30 52 50 42 Q 30 60 10 42"
      fill="url(#gradBleu)"
      opacity="0.7"
    />
  </svg>
);

// ─── En-tête (haut de page) ───────────────────
export const EnTete = () => {
  return (
    <header className="entete">
      <div className="entete__logo-wrapper">
        <LogoPyrene />
      </div>
      <h1 className="entete__titre">Pyrène Automation</h1>
    </header>
  );
};

// ─── Pied de page (bas de page) ───────────────
export const PiedDePage = () => {
  return <footer className="pied-de-page"></footer>;
};

export default EnTete;
