export const getTreatedData = async () => {
    try {
      const response = await fetch('http://localhost:5000/treated-files', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching treated data:", error);
      return [];
    }
  };
  
  export const getUntreatedData = async () => {
    try {
      const response = await fetch('http://localhost:5000/untreated-files', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching untreated data:", error);
      return [];
    }
  };  