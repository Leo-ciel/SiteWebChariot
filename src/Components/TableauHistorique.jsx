// =============================================
// COMPOSANT PARTAGÉ : Tableau Historique
// Utilisé par DebutFinDeCourse et RoueCodeuse
// =============================================

const TableauHistorique = ({ historique }) => {
  return (
    <div className="mesures__panneau">
      <div className="mesures__panneau-titre">Historique</div>
      <div className="mesures__panneau-corps" style={{ padding: "0" }}>
        <table className="mesures__historique-tableau">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Événement</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {historique.map((ligne) => (
              <tr key={ligne.id}>
                <td>{ligne.heure}</td>
                <td>{ligne.evenement}</td>
                <td>
                  <span
                    className={`mesures__badge mesures__badge--${ligne.statut}`}
                  >
                    {ligne.statut === "ok"
                      ? "✓ OK"
                      : ligne.statut === "alerte"
                        ? "⚠ Alerte"
                        : "✗ Erreur"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableauHistorique;
