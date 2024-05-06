const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        return { success: true, message: "File uploaded successfully!" };
      } else {
        const error = await response.text();
        throw new Error(error || "Failed to upload file.");
      }
    } catch (error) {
      return { success: false, message: error.message || "Failed to upload file." };
    }
  };
  
  export default uploadFile;
  