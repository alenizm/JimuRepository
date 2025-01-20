// Function to fetch and display machines dynamically
async function displayMachines() {
  const machineList = document.getElementById("machine-list");

  try {
    console.log("Fetching machines...");
    const token = localStorage.getItem("access_token");
    console.log("Access Token:", token);

    const response = await fetch(
      "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/Machines",
      {
        method: "GET",
      }
    );

    console.log("API Response:", response);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch machines: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log("Machines Data:", responseData);

    // Parse the body (it's a JSON string)
    const parsedBody = JSON.parse(responseData.body);
    const machines = parsedBody.machines;

    if (!Array.isArray(machines)) {
      throw new Error("Machines data is not an array");
    }

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
        <button onclick="openLogModal('${machine.MachineID}', '${machine.Name}')">Log Workout</button>
      `;

      machineList.appendChild(machineCard);
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    machineList.innerHTML =
      "<p>Failed to load machines. Please try again later.</p>";
  }
}

// Function to open the modal for logging a workout
function openLogModal(machineId, machineName) {
  const modal = document.getElementById("logModal");
  const modalMachineName = document.getElementById("modal-machine-name");
  const machineIdInput = document.getElementById("machine-id");

  modalMachineName.textContent = machineName;
  machineIdInput.value = machineId;
  modal.style.display = "block";
}

// Function to close the modal and clear fields
function closeLogModal() {
  const modal = document.getElementById("logModal");
  const form = document.getElementById("logForm"); // Assuming the form has this ID
  form.reset(); // Clear all input fields
  modal.style.display = "none";
}

// Function to submit the workout log
async function submitWorkoutLog(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("You are not logged in. Please log in to continue.");
    return;
  }

  // Decode the token to extract UserID
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const decodedPayload = JSON.parse(atob(base64));

  const userId = decodedPayload.client_id; // Adjust based on token structure
  if (!userId) {
    alert("Failed to extract UserID from token. Please log in again.");
    return;
  }

  // Collect input values for query string
  const machineId = document.getElementById("machine-id").value;
  const sets = document.getElementById("sets").value;
  const weight = document.getElementById("weight").value;
  const repetitions = document.getElementById("repetitions").value;

  // Construct the query string
  const queryString = new URLSearchParams({
    MachineID: machineId,
    Set: sets,
    Weight: weight,
    Repetitions: repetitions,
  }).toString();

  // Payload with only UserID
  const payload = {
    UserID: userId,
  };

  try {
    const response = await fetch(
      `https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/Records?${queryString}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to log workout: ${response.status} ${response.statusText}`
      );
    }

    console.log("Workout logged successfully.");
    alert("Workout logged successfully!");
    closeLogModal(); // Close the modal and reset fields
  } catch (error) {
    console.error("Error logging workout:", error);
    alert("Failed to log workout. Please try again.");
  }
}

// Initialize the machine display when the page loads
document.addEventListener("DOMContentLoaded", displayMachines);
