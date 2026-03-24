// =============================================
// COMPOSANT : Orchestrateur principal
// =============================================

import { useState } from "react";
import Accueil from "./Components/Accueil";
import CommandeChariot from "./Components/CommandeChariot";
import Connexion from "./Components/Connexion";
import { EnTete, PiedDePage } from "./Components/EnTete";
import Inscription from "./Components/Inscription";
import MesuresTempsReel from "./Components/MesuresTempsReel";
import Systeme from "./Components/Systeme";

// ─── Titres dans l'en-tête ─────────────────────
const TITRES_PAGES = {
  connexion: "Pyrène Automation",
  accueil: "Accueil",
  "commande-chariot": "Commande Chariot",
  "mesures-temps-reel": "Mesures en temps réel",
  systeme: "Système",
};

const App = () => {
  const [pageCourante, setPageCourante] = useState("connexion");
  const [comptes, setComptes] = useState([]);
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

  // ─── Navigation ──────────────────────────────
  const changerPage = (page, donnees = null) => {
    if (page === "accueil" && donnees) setUtilisateurConnecte(donnees);
    setPageCourante(page);
  };

  // ─── Gestion des comptes ─────────────────────
  const ajouterCompte = (nouveau) => setComptes((prev) => [...prev, nouveau]);
  const supprimerCompte = (email) =>
    setComptes((prev) => prev.filter((c) => c.email !== email));
  const modifierCompte = (updated) =>
    setComptes((prev) =>
      prev.map((c) => (c.email === updated.email ? updated : c)),
    );

  // ─── Rendu de la page courante ────────────────
  const rendrePage = () => {
    switch (pageCourante) {
      case "connexion":
        return <Connexion comptes={comptes} surChangementPage={changerPage} />;
      case "inscription":
        return (
          <Inscription
            comptes={comptes}
            surNouveauCompte={ajouterCompte}
            surChangementPage={changerPage}
          />
        );
      case "accueil":
        return (
          <Accueil
            utilisateur={utilisateurConnecte}
            surChangementPage={changerPage}
          />
        );
      case "commande-chariot":
        return <CommandeChariot surChangementPage={changerPage} />;
      case "mesures-temps-reel":
        return <MesuresTempsReel surChangementPage={changerPage} />;
      case "systeme":
        return (
          <Systeme
            surChangementPage={changerPage}
            comptes={comptes}
            surAjoutCompte={ajouterCompte}
            surSuppressionCompte={supprimerCompte}
            surModificationCompte={modifierCompte}
            utilisateurConnecte={utilisateurConnecte}
          />
        );
      default:
        return <Connexion comptes={comptes} surChangementPage={changerPage} />;
    }
  };

  const titreEntete = TITRES_PAGES[pageCourante] || "Pyrène Automation";
  const enteteEnBas = pageCourante === "inscription";

  return (
    <>
      {!enteteEnBas && <EnTete titre={titreEntete} />}
      {rendrePage()}
      {enteteEnBas ? <EnTete /> : <PiedDePage />}
    </>
  );
};

export default App;
