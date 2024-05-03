export const createFile = async (audioBlob, fileName) => {
    const formData = new FormData();
    formData.append("file", audioBlob, fileName);
  
    try {
      const response = await fetch('http://localhost:5000/api/saveAudio', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in creating file:', error);
      throw error;
    }
  };
  
  export const deleteFile = async (fileName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/deleteAudio/${fileName}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in deleting file:', error);
      throw error;
    }
  };
  