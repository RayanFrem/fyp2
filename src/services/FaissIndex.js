async function buildIndex(embeddings) {
    const response = await fetch('http://localhost:5000/build-index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeddings })
    });
    const result = await response.json();
    return result;
  }
  
  async function search(queryEmbedding, k = 4) {
    const response = await fetch('http://localhost:5000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ queryEmbedding, k })
    });
    const result = await response.json();
    return result.indices;
  }
  
  module.exports = {
    buildIndex,
    search
  };