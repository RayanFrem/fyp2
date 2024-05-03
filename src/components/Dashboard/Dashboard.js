import React, { useState, useEffect } from 'react';
import { getTreatedData, getUntreatedData } from '../../services/getPDFs';
import { treatData, fetchChromaDBData } from '../../services/ChromaDB';
import { fetchFAQData } from '../../services/MySQL'; // Ensure you've created this service
import './Dashboard.css';

function Dashboard() {
  const [treatedFiles, setTreatedFiles] = useState([]);
  const [untreatedFiles, setUntreatedFiles] = useState([]);
  const [chromaDBData, setChromaDBData] = useState({ documents: [], ids: [], embeddings: [], metadatas: [] });
  const [faqData, setFaqData] = useState([]); // State to hold FAQ data
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchFilesAndData() {
      setIsLoading(true);
      const treated = await getTreatedData();
      const untreated = await getUntreatedData();
      const chromaData = await fetchChromaDBData();
      const faq = await fetchFAQData(); // Fetch FAQ data from the new service

      setTreatedFiles(treated.length ? treated : ['No treated data available']);
      setUntreatedFiles(untreated.length ? untreated : ['No untreated data available']);
      setChromaDBData(chromaData || { documents: [], ids: [], embeddings: [], metadatas: [] });
      setFaqData(faq); // Set FAQ data
      setIsLoading(false);
    }

    fetchFilesAndData();
  }, []);

  const handleIndexData = async () => {
    setIsLoading(true);
    try {
      await treatData();
      alert("Data indexed successfully!");
    } catch (error) {
      alert("Failed to index data. Please check the console for more information.");
      console.error("Error indexing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button onClick={handleIndexData} disabled={isLoading}>
          {isLoading ? 'Indexing...' : 'Index Data'}
        </button>
        {isLoading && <p>Loading...</p>}
      </div>
      <div>
        <h3>Untreated Data</h3>
        {untreatedFiles.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">File Name</th>
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
          <p>No untreated data available.</p>
        )}
      </div>
      
      <div>
        <h3>Treated Data</h3>
        {treatedFiles.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">File Name</th>
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
          <p>No treated data available.</p>
        )}
      </div>
      
      <div>
        <h3>ChromaDB Data</h3>
        {chromaDBData.documents && chromaDBData.documents.length > 0 ? (
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
                  <td className="td">{chromaDBData.metadatas && chromaDBData.metadatas[index] ? JSON.stringify(chromaDBData.metadatas[index]) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No ChromaDB data found.</p>
        )}
      </div>
      <div>
        <h3>FAQ Data</h3>
        {faqData.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="tr">
                <th className="th">ID</th>
                <th className="th">Question</th>
                <th className="th">Answer</th>
              </tr>
            </thead>
            <tbody>
              {faqData.map(({ id, question, answer }, index) => (
                <tr key={index} className="tr">
                  <td className="td">{id}</td>
                  <td className="td">{question}</td>
                  <td className="td">{answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No FAQ data available.</p>
        )}
      </div>
    </div>
  );  
}

export default Dashboard;
