export const fetchChromaDBData = async () => {
  try {
    const response = await fetch('http://localhost:5000/view-indexed', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error("Error fetching ChromaDB data:", error);
    return [];
  }
};

export const treatData = async () => {
  try {
    const response = await fetch('http://localhost:5000/treat-data', {
      method: 'POST', 
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error("Error treating data:", error);
  }
};
