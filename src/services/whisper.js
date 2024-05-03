async function getTranscription(audioFileName) {
      const response = await fetch('http://localhost:5000/get-audio-transcription', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filename: audioFileName })
      });
    
      if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Network response was not ok';
          throw new Error(errorMessage);
      }
    
      const data = await response.json();
      return data.transcription;
}

export { getTranscription };
