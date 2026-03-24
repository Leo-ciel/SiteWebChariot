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
// Alerte est géré dans MesuresTempsReel — plus besoin de l'importer ici

// ─── Titres affichés dans l'en-tête selon la page ─
const TITRES_PAGES = {
  connexion: "Pyrène Automation",
  accueil: "Accueil",
  "commande-chariot": "Commande Chariot",
  "mesures-temps-reel": "Mesures en temps réel",
};

const App = () => {
  // ─── État global de navigation ───────────────
  const [pageCourante, setPageCourante] = useState("connexion");

  // ─── Liste des comptes utilisateurs inscrits ─
  const [comptes, setComptes] = useState([]);

  // ─── Utilisateur connecté ────────────────────
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

  // ─── Gestionnaire de navigation ──────────────
  const changerPage = (page, donnees = null) => {
    if (page === "accueil" && donnees) {
      setUtilisateurConnecte(donnees);
    }
    setPageCourante(page);
  };

  // ─── Ajout d'un nouveau compte ───────────────
  const ajouterCompte = (nouveauCompte) => {
    setComptes((prev) => [...prev, nouveauCompte]);
  };

  // ─── Choix du composant de page ──────────────
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
