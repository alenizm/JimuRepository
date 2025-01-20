// API Gateway Endpoints
const machinesApiEndpoint = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/machines"; // Replace with your endpoint
const trainingProgramApiEndpoint = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/programs"; // Replace with your endpoint
const traineesApiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/trainees"; // Replace with your endpoint

let trainingProgram = [];
let selectedUserEmail = ""; // Store selected user email

// Function to decode JWT
function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

// Get Trainer Name from Access Token
function getTrainerName() {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    alert("No access token found. Please log in.");
    return null;
  }

  const decodedToken = parseJwt(accessToken);
  const trainerName = decodedToken.name || decodedToken.username; // Use 'name' or 'username'

  if (!trainerName) {
    alert("Trainer name not found in token.");
    return null;
  }

  return trainerName;
}

// Fetch Trainees from API
async function fetchTrainees() {
  try {
    const userPoolId = "us-east-1_gXjTPXbr6"; // Replace with your User Pool ID
    const groupName = "trainees"; // Replace with the name of your group

    const response = await fetch(`${traineesApiEndpoint}?UserPoolId=${userPoolId}&GroupName=${groupName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch trainees");
    }

    const responseBody = await response.json();
    const trainees = JSON.parse(responseBody.body);

    console.log("Trainees fetched successfully:", trainees);

    // Render trainees to the HTML
    const traineesList = document.getElementById("trainees");
    trainees.forEach((trainee) => {
      const card = document.createElement("div");
      card.className = "trainee-card";
      card.setAttribute("data-email", trainee.email);

      card.innerHTML = `
        <div class="trainee-info">
          <h2>${trainee.username}</h2>
          <p>Email: ${trainee.email}</p>
        </div>
        <button class="create-program-btn" onclick="selectUser('${trainee.email}')">Create Training Program</button>
      `;

      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    alert("Failed to fetch trainees. Please try again later.");
  }
}

// Fetch Machines from API
async function fetchMachines() {
  try {
    const response = await fetch(machinesApiEndpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch machines.");

    const machines = await response.json();
    const machineSelect = document.getElementById("machine-select");
    machines.forEach((machine) => {
      const option = document.createElement("option");
      option.value = machine.name; // Assuming machine has 'name' property
      option.textContent = machine.name;
      machineSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    alert("Failed to load machines.");
  }
}

// Add Machine to Program
function addMachineToProgram() {
  const machineName = document.getElementById("machine-select").value;
  if (!machineName) {
    alert("Select a machine.");
    return;
  }
  const sets = [];
  const setsContainer = document.getElementById("sets-container");
  for (let i = 0; i < setsContainer.children.length; i++) {
    const weight = document.getElementById(`weight-${i + 1}`).value;
    const reps = document.getElementById(`reps-${i + 1}`).value;
    sets.push({ weight, reps });
  }
  trainingProgram.push({ machine: machineName, sets });
  document.getElementById("program-summary").innerHTML += `<li>${machineName} - ${sets.length} sets</li>`;
  document.getElementById("sets-container").innerHTML = "";
}

// Select User for Training Program
function selectUser(email) {
  selectedUserEmail = email;
  openProgramModal();
}

// Submit Program via POST
async function submitProgram() {
  if (trainingProgram.length === 0) {
    alert("Add at least one machine to the program.");
    return;
  }

  if (!selectedUserEmail) {
    alert("No user selected for the training program.");
    return;
  }

  const trainerName = getTrainerName();
  if (!trainerName) return;

  const bodyPayload = {
    UserEmail: selectedUserEmail,
    TrainerName: trainerName, // Use the trainer's name instead of ID
  };

  const queryParameters = {
    PlanDetails: JSON.stringify(trainingProgram), // Convert training program to JSON string
  };

  try {
    const response = await fetch(
      `${trainingProgramApiEndpoint}?PlanDetails=${encodeURIComponent(queryParameters.PlanDetails)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit training program.");
    }

    const result = await response.json();
    console.log("Program submitted successfully:", result);
    alert("Training program submitted successfully!");

    // Reset program
    trainingProgram = [];
    selectedUserEmail = "";
    document.getElementById("program-summary").innerHTML = "";
    closeProgramModal();
  } catch (error) {
    console.error("Error submitting training program:", error);
    alert("Failed to submit training program. Please try again.");
  }
}

// Add Set Row
function addSet() {
  const setsContainer = document.getElementById("sets-container");
  const setIndex = setsContainer.children.length + 1;

  const setDiv = document.createElement("div");
  setDiv.className = "form-group";
  setDiv.innerHTML = `
    <h4>Set ${setIndex}</h4>
    <label for="weight-${setIndex}">Weight (kg):</label>
    <input type="number" id="weight-${setIndex}" name="weight-${setIndex}" required />
    <label for="reps-${setIndex}">Reps:</label>
    <input type="number" id="reps-${setIndex}" name="reps-${setIndex}" required />
  `;
  setsContainer.appendChild(setDiv);
}

// Open the Modal
function openProgramModal() {
  document.getElementById("programModal").style.display = "flex";
  document.getElementById("machine-select").value = ""; // Reset machine select
  document.getElementById("sets-container").innerHTML = ""; // Clear sets
}

// Close the Modal
function closeProgramModal() {
  document.getElementById("programModal").style.display = "none";
}

// Event Listener for Page Load
document.addEventListener("DOMContentLoaded", () => {
  fetchMachines();
  fetchTrainees();
});
