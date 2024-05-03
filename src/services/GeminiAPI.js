async function getGeminiSuggestions(question, answer, prompt) {
    const response = await fetch('http://localhost:5000/get-gemini-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, answer, prompt })
    });
    const result = await response.json();
    return result;
  }
  
  async function getGeminiAnswer(prompt) {
    const response = await fetch('http://localhost:5000/get-gemini-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const result = await response.json();
    return [result.answer,result.context];
  }
  
  module.exports = {
    getGeminiSuggestions,
    getGeminiAnswer
  };