// Mock machine data (replace with API call in the future)
const mockMachines = [
    { id: 1, name: "Treadmill", description: "Great for running indoors." },
    { id: 2, name: "Bench Press", description: "Perfect for chest exercises." },
    { id: 3, name: "Rowing Machine", description: "Full-body cardio workout." },
    { id: 4, name: "Elliptical", description: "Low-impact cardio exercise." },
    { id: 5, name: "Lat Pulldown", description: "Build strength in your back." },
  ];
  
  // Function to fetch and display machines dynamically
  function displayMachines() {
    const machineList = document.getElementById("machine-list");
  
    // Clear the current list
    machineList.innerHTML = "";
  
    // Dynamically generate machine cards
    mockMachines.forEach((machine) => {
      const machineCard = document.createElement("div");
      machineCard.className = "machine-card";
  
      machineCard.innerHTML = `
        <h3>${machine.name}</h3>
        <p>${machine.description}</p>
        <button onclick="logMachine('${machine.id}', '${machine.name}')">Log Workout</button>
      `;
  
      machineList.appendChild(machineCard);
    });
  }
  
  // Example function to handle machine interaction
  function logMachine(machineId, machineName) {
    alert(`Logging workout for ${machineName} (ID: ${machineId})`);
  }
  
  // Exporting the functions
  export { displayMachines, logMachine };
  