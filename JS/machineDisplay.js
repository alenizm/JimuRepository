// Function to fetch and display machines dynamically
async function displayMachines() {
  const machineList = document.getElementById("machine-list");

  try {
    console.log("Fetching machines...");
    const token = localStorage.getItem("access_token");
    console.log("Access Token:", token);

    const response = await fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/Machines", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("API Response:", response);

    if (!response.ok) {
      throw new Error(`Failed to fetch machines: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Machines Data:", data);

    const machines = JSON.parse(data.body).machines;

    // Clear the current list
    machineList.innerHTML = "";

    // Dynamically generate machine cards
    machines.forEach((machine) => {
      const machineCard = document.createElement("div");
      machineCard.className = "machine-card";

      machineCard.innerHTML = `
        <h3>${machine.Name}</h3>
        <p><strong>Location:</strong> ${machine.Location}</p>
        <p><strong>Status:</strong> ${machine.Status}</p>
        <p><strong>Last Maintenance:</strong> ${machine.LastMaintenance}</p>
        <p><strong>Next Maintenance:</strong> ${machine.NextMaintenance}</p>
        <button onclick="logMachine('${machine.MachineID}', '${machine.Name}')">Log Workout</button>
      `;

      machineList.appendChild(machineCard);
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    machineList.innerHTML = "<p>Failed to load machines. Please try again later.</p>";
  }
}

// Function to handle logging a workout
function logMachine(machineId, machineName) {
  alert(`Logging workout for ${machineName} (ID: ${machineId})`);
}

// Scroll functions
function scrollLeft() {
  const machineList = document.getElementById("machine-list");
  machineList.scrollBy({ left: -250, behavior: "smooth" });
}

function scrollRight() {
  const machineList = document.getElementById("machine-list");
  machineList.scrollBy({ left: 250, behavior: "smooth" });
}

// Initialize the display of machines on page load
document.addEventListener("DOMContentLoaded", () => {
  displayMachines();
});

export { displayMachines, logMachine, scrollLeft, scrollRight };
