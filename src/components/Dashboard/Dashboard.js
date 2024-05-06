import React, { useState, useEffect } from 'react';
import { getTreatedData, getUntreatedData } from '../../services/getPDFs';
import { treatData, fetchChromaDBData } from '../../services/ChromaDB';
import uploadFile from '../../services/fileUploadService';
import './Dashboard.css';

function Dashboard() {
  const [treatedFiles, setTreatedFiles] = useState([]);
  const [untreatedFiles, setUntreatedFiles] = useState([]);
  const [chromaDBData, setChromaDBData] = useState({ documents: [], ids: [], embeddings: [], metadatas: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const statusMsg = sessionStorage.getItem('statusMessage');
    if (statusMsg) {
      setStatusMessage(statusMsg);
      sessionStorage.removeItem('statusMessage'); 
    }

    async function fetchFilesAndData() {
      setIsLoading(true);
      const treated = await getTreatedData();
      const untreated = await getUntreatedData();
      const chromaData = await fetchChromaDBData();

      setTreatedFiles(treated.length ? treated : ['Aucune donnée traitée disponible']);
      setUntreatedFiles(untreated.length ? untreated : ['Aucune donnée non traitée disponible']);
      setChromaDBData(chromaData || { documents: [], ids: [], embeddings: [], metadatas: [] });
      setIsLoading(false);
    }

    fetchFilesAndData();
  }, []);

  const handleIndexData = async () => {
    setIsLoading(true);
    try {
      await treatData();
      sessionStorage.setItem('statusMessage', 'Données indexées avec succès!');
      window.location.reload();
    } catch (error) {
      sessionStorage.setItem('statusMessage', "Échec de l'indexation des données. Consultez la console pour plus d'informations.");
      window.location.reload();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setStatusMessage('');
    } else {
      setStatusMessage("Veuillez télécharger uniquement des fichiers PDF.");
    }
  };

  const handleFileUpload = async () => {
    if (selectedFile) {
      const result = await uploadFile(selectedFile);
      sessionStorage.setItem('statusMessage', result.message);
      window.location.reload();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button onClick={handleIndexData} disabled={isLoading || selectedFile}>
          {isLoading ? 'Indexation en cours...' : 'Indexer les données'}
        </button>
        <input type="file" onChange={handleFileChange} accept=".pdf" />
        <button onClick={handleFileUpload} disabled={!selectedFile || isLoading}>
          Télécharger un fichier
        </button>
        {statusMessage && (
          <div className={`upload-status ${statusMessage.includes('successfully') ? 'success' : 'error'}`}>
            {statusMessage}
          </div>
        )}
        {isLoading && <p>Chargement...</p>}
      </div>
      <div>
        <h3>Données non traitées</h3>
        {untreatedFiles.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">Nom du fichier</th>
              </tr>
            </thead>
            <tbody>
              {untreatedFiles.map((file, index) => (
                <tr key={index} className="tr">
                  <td className="td">{file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucune donnée non traitée disponible.</p>
        )}
      </div>
      <div>
        <h3>Données traitées</h3>
        {treatedFiles.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">Nom du fichier</th>
              </tr>
            </thead>
            <tbody>
              {treatedFiles.map((file, index) => (
                <tr key={index} className="tr">
                  <td className="td">{file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucune donnée traitée disponible.</p>
        )}
      </div>
      <div>
        <h3>Données ChromaDB</h3>
        {chromaDBData.documents.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">ID</th>
                <th className="th">Document</th>
                <th className="th">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {chromaDBData.documents.map((document, index) => (
                <tr key={index} className="tr">
                  <td className="td">{chromaDBData.ids[index]}</td>
                  <td className="td">{document}</td>
                  <td className="td">{chromaDBData.metadatas[index] ? JSON.stringify(chromaDBData.metadatas[index]) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucune donnée ChromaDB trouvée.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
