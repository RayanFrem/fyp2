async function embedChunk(chunk) {
  const response = await fetch('http://localhost:5000/embed-sentence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sentence: chunk })
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return await response.json();
}

module.exports = {
embedChunk,
};
