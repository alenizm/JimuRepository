// Function to fetch and display machines dynamically
async function displayMachines() {
  const machineList = document.getElementById("machine-list");

  try {
    console.log("Fetching machines...");
    const token = localStorage.getItem("access_token");
    console.log("Access Token:", token);

    const response = await fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/Machines", {
      method: "GET", // Explicitly specify GET
    });

    console.log("API Response:", response);

    if (!response.ok) {
      throw new Error(`Failed to fetch machines: ${response.status} ${response.statusText}`);
    }

    const machines = await response.json();
    console.log("Machines Data:", machines);

    // Clear the current list
    machineList.innerHTML = "";

    // Dynamically generate machine cards
    machines.forEach((machine) => {
      const machineCard = document.createElement("div");
      machineCard.className = "machine-card";

      machineCard.innerHTML = `
        <h3>${machine.name}</h3>
        <p>${machine.description}</p>
        <button onclick="logMachine('${machine.id}', '${machine.name}')">Log Workout</button>
      `;

      machineList.appendChild(machineCard);
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    machineList.innerHTML = "<p>Failed to load machines. Please try again later.</p>";
  }
}

// Example function to handle machine interaction
function logMachine(machineId, machineName) {
  alert(`Logging workout for ${machineName} (ID: ${machineId})`);
}

// Exporting the functions
export { displayMachines, logMachine };
