// =============================================
// APP.JSX — Orchestrateur principal
// Navigation : connexion | inscription | tableau-de-bord
// =============================================

import { useState } from "react";
import Connexion from "./Components/Connexion";
import { EnTete, PiedDePage } from "./Components/EnTete";
import Inscription from "./Components/Inscription";
import TableauDeBord from "./Components/TableauDebord";

const App = () => {
  // ─── État global de navigation ───────────────
  const [pageCourante, setPageCourante] = useState("connexion");

  // ─── Liste des comptes utilisateurs inscrits ─
  // (stocké en mémoire — en production, utiliser une API/BDD)
  const [comptes, setComptes] = useState([]);

  // ─── Utilisateur connecté ────────────────────
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

  // ─── Gestionnaire de navigation ──────────────
  const changerPage = (page, donnees = null) => {
    if (page === "tableau-de-bord" && donnees) {
      setUtilisateurConnecte(donnees);
    }
    setPageCourante(page);
  };

  // ─── Ajout d'un nouveau compte ───────────────
  const ajouterCompte = (nouveauCompte) => {
    setComptes((prev) => [...prev, nouveauCompte]);
  };

  // ─── Déconnexion ─────────────────────────────
  const seDeconnecter = () => {
    setUtilisateurConnecte(null);
    setPageCourante("connexion");
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
      case "tableau-de-bord":
        return (
          <TableauDeBord
            utilisateur={utilisateurConnecte}
            surDeconnexion={seDeconnecter}
          />
        );
      default:
        return <Connexion comptes={comptes} surChangementPage={changerPage} />;
    }
  };

  // ─── Affichage conditionnel de l'en-tête ─────
  // Page connexion → en-tête en HAUT
  // Page inscription → en-tête en BAS (comme la maquette)
  const enteteEnHaut = pageCourante !== "inscription";
  const enteteEnBas = pageCourante === "inscription";

  return (
    <>
      {enteteEnHaut && <EnTete />}
      {rendrePage()}
      {enteteEnBas ? <EnTete /> : <PiedDePage />}
    </>
  );
};

export default App;
